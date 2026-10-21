package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "modernc.org/sqlite"
)

// PRD Section 9: Data Models
type Shop struct {
	ID          int64   `json:"id"`
	Marketplace string  `json:"marketplace"`
	Name        string  `json:"name"`
	Location    string  `json:"location"`
	ShopType    string  `json:"shop_type"`
	Followers   int     `json:"followers"`
	Rating      float64 `json:"rating"`
}

type Product struct {
	ID        int64     `json:"id"`
	ShopID    int64     `json:"shop_id"`
	Name      string    `json:"product_name"`
	Brand     string    `json:"product_brand"`
	Category  string    `json:"category"`
	SKU       string    `json:"sku"`
	URL       string    `json:"url"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"created_at"`
	// Joined latest snapshot fields
	Price       float64 `json:"price"`
	TotalSold   int     `json:"total_sold"`
	DailySold   int     `json:"qty"`
	Stock       int     `json:"stock"`
	Rating      float64 `json:"rating"`
	ReviewCount int     `json:"review_count"`
	Status      int     `json:"status"` // 1: Data Lama, 2: Aktif, 3: Stok Habis
}

type ScrapeJob struct {
	ID           int64     `json:"id"`
	JobType      string    `json:"type"`
	Payload      string    `json:"payload"`
	Status       string    `json:"status"` // pending, running, success, failed
	Attempts     int       `json:"attempts"`
	RunAt        time.Time `json:"run_at"`
	ErrorMessage string    `json:"error_message,omitempty"`
}

var db *sql.DB

func initDB() {
	var err error
	dbPath := filepath.Join(".", "data", "marketplace.db")
	_ = os.MkdirAll(filepath.Dir(dbPath), 0755)

	db, err = sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}

	createSchema := `
	CREATE TABLE IF NOT EXISTS shops (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		marketplace TEXT NOT NULL,
		name TEXT NOT NULL,
		location TEXT,
		shop_type TEXT,
		followers INTEGER DEFAULT 0,
		rating REAL DEFAULT 0.0
	);

	CREATE TABLE IF NOT EXISTS products (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		shop_id INTEGER,
		name TEXT NOT NULL,
		brand TEXT,
		category TEXT,
		sku TEXT,
		url TEXT,
		image TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(shop_id) REFERENCES shops(id)
	);

	CREATE TABLE IF NOT EXISTS product_snapshots (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		product_id INTEGER,
		captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		price REAL,
		total_sold INTEGER,
		stock INTEGER,
		rating REAL,
		review_count INTEGER,
		FOREIGN KEY(product_id) REFERENCES products(id)
	);

	CREATE TABLE IF NOT EXISTS daily_sales (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		product_id INTEGER,
		tanggal DATE,
		terjual_hari_itu INTEGER,
		FOREIGN KEY(product_id) REFERENCES products(id)
	);

	CREATE TABLE IF NOT EXISTS scrape_jobs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type TEXT,
		payload TEXT,
		status TEXT DEFAULT 'pending',
		attempts INTEGER DEFAULT 0,
		run_at DATETIME,
		locked_at DATETIME,
		error_message TEXT
	);
	`
	_, err = db.Exec(createSchema)
	if err != nil {
		log.Fatalf("Failed to create tables: %v", err)
	}

	seedInitialDataIfEmpty()
}

func seedInitialDataIfEmpty() {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding initial marketplace data according to PRD...")

	// Insert Shops
	res1, _ := db.Exec(`INSERT INTO shops (marketplace, name, location, shop_type, followers, rating) VALUES 
		('Shopee Mall', 'Baseus Official Store ID', 'Jakarta Barat', 'Official Store', 420000, 4.9),
		('Shopee Mall', 'Erigo Official Store', 'Kab. Tangerang', 'Official Store', 1200000, 4.88),
		('Tokopedia Official', 'AeroStreet Official', 'Klaten, Jawa Tengah', 'Official Store', 850000, 4.92)`)
	
	s1, _ := res1.LastInsertId()

	// Insert Products
	items := []struct {
		shopID   int64
		name     string
		brand    string
		cat      string
		sku      string
		url      string
		image    string
		price    float64
		sold     int
		daily    int
		stock    int
		rating   float64
		reviews  int
	}{
		{s1, "TWS Baseus Bowie M2+ ANC Earphone", "Baseus", "Elektronik", "BS-M2P-BLK", "https://shopee.co.id/baseus-bowie-m2", "amazon-echo.png", 489000, 24810, 184, 1, 4.9, 4218},
		{s1, "Baseus Blade Powerbank 100W 20000mAh", "Baseus", "Elektronik", "BS-PB-100W", "https://shopee.co.id/baseus-blade-100w", "headphones.png", 699000, 14200, 96, 1, 4.85, 2810},
		{s1 + 1, "Erigo T-Shirt Oversize Vintage Japan", "Erigo", "Fashion", "ERG-TSH-01", "https://shopee.co.id/erigo-vintage", "1.png", 115000, 84200, 310, 1, 4.88, 18450},
		{s1 + 1, "Erigo Chino Pants Slim Fit Khaki", "Erigo", "Fashion", "ERG-CP-KHK", "https://shopee.co.id/erigo-chino", "2.png", 185000, 32100, 142, 1, 4.82, 6420},
		{s1 + 2, "Sepatu AeroStreet Massive Low White", "AeroStreet", "Fashion", "AERO-MSV-WHT", "https://tokopedia.com/aerostreet-massive", "nike-air-jordan.png", 149000, 145000, 420, 1, 4.94, 38100},
	}

	for _, it := range items {
		res, _ := db.Exec(`INSERT INTO products (shop_id, name, brand, category, sku, url, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			it.shopID, it.name, it.brand, it.cat, it.sku, it.url, it.image)
		pid, _ := res.LastInsertId()

		// Snapshot
		db.Exec(`INSERT INTO product_snapshots (product_id, captured_at, price, total_sold, stock, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			pid, time.Now().Add(-24*time.Hour), it.price, it.sold-it.daily, it.stock, it.rating, it.reviews-15)
		db.Exec(`INSERT INTO product_snapshots (product_id, captured_at, price, total_sold, stock, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			pid, time.Now(), it.price, it.sold, it.stock, it.rating, it.reviews)

		// Daily Sales (F-08: difference between snapshots)
		db.Exec(`INSERT INTO daily_sales (product_id, tanggal, terjual_hari_itu) VALUES (?, ?, ?)`,
			pid, time.Now().Format("2006-01-02"), it.daily)
	}

	// Seed default pending scrape jobs (PRD F-03: default sehari melalui scheduler)
	seedScrapeJobs()
}

func seedScrapeJobs() {
	var jobCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM scrape_jobs WHERE status = 'pending'").Scan(&jobCount)
	if jobCount == 0 {
		targets := []string{
			"https://www.tokopedia.com",
			"https://shopee.co.id",
			"https://shopee.co.id/baseus-bowie-m2",
		}
		for _, url := range targets {
			db.Exec(`INSERT INTO scrape_jobs (type, payload, status, run_at) VALUES ('product_crawl', ?, 'pending', ?)`,
				url, time.Now())
		}
		log.Println("Seeded pending scrape jobs into queue.")
	}
}

func main() {
	initDB()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
	}))

	// API Endpoints
	r.Route("/api", func(r chi.Router) {
		// Ranking Produk Terlaris (PRD F-12, F-15, F-16)
		r.Get("/products", handleGetProducts)
		// Detail Produk & Toko (PRD F-13, F-14)
		r.Get("/products/{id}", handleGetProductDetail)
		// Trigger / Queue Scrape Job (PRD F-03, F-04, 6.1)
		r.Post("/scrape/trigger", handleTriggerScrapeJob)
		// Worker job polling (SKIP LOCKED simulator)
		r.Get("/scrape/next-job", handleNextScrapeJob)
		// Ingest scraped payload from Node.js Playwright worker (PRD F-07, F-08)
		r.Post("/scrape/ingest", handleIngestScrapedData)
	})

	// Redirect root / to dashboard
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/dashboard/pages/index.html", http.StatusFound)
	})
	r.Get("/api", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"name":    "Rankwise Marketplace Intelligence API",
			"status":  "running",
			"version": "1.0.0",
			"endpoints": []string{
				"/api/products",
				"/api/products/{id}",
				"/api/scrape/trigger",
				"/api/scrape/next-job",
				"/api/scrape/ingest",
			},
		})
	})

	// Serve Static Dashboard files
	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "..", "dashboard"))
	FileServer(r, "/dashboard", filesDir)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Rankwise Marketplace Intelligence API listening on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func handleGetProducts(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")

	query := `
	SELECT p.id, p.shop_id, p.name, p.brand, p.category, p.sku, p.url, p.image,
	       COALESCE(s.price, 0), COALESCE(s.total_sold, 0), COALESCE(ds.terjual_hari_itu, 0),
	       COALESCE(s.stock, 1), COALESCE(s.rating, 5.0), COALESCE(s.review_count, 0)
	FROM products p
	LEFT JOIN (
		SELECT product_id, price, total_sold, stock, rating, review_count
		FROM product_snapshots
		WHERE id IN (SELECT MAX(id) FROM product_snapshots GROUP BY product_id)
	) s ON p.id = s.product_id
	LEFT JOIN (
		SELECT product_id, terjual_hari_itu
		FROM daily_sales
		WHERE id IN (SELECT MAX(id) FROM daily_sales GROUP BY product_id)
	) ds ON p.id = ds.product_id
	`
	var rows *sql.Rows
	var err error

	if category != "" {
		query += " WHERE p.category = ?"
		rows, err = db.Query(query, category)
	} else {
		rows, err = db.Query(query)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(&p.ID, &p.ShopID, &p.Name, &p.Brand, &p.Category, &p.SKU, &p.URL, &p.Image,
			&p.Price, &p.TotalSold, &p.DailySold, &p.Stock, &p.Rating, &p.ReviewCount)
		if err != nil {
			continue
		}
		p.Status = 2 // Aktif
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": products,
	})
}

func handleGetProductDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p Product
	var shop Shop

	err := db.QueryRow(`
		SELECT p.id, p.shop_id, p.name, p.brand, p.category, p.sku, p.url, p.image,
		       sh.id, sh.marketplace, sh.name, sh.location, sh.shop_type, sh.followers, sh.rating
		FROM products p
		JOIN shops sh ON p.shop_id = sh.id
		WHERE p.id = ?`, id).Scan(
		&p.ID, &p.ShopID, &p.Name, &p.Brand, &p.Category, &p.SKU, &p.URL, &p.Image,
		&shop.ID, &shop.Marketplace, &shop.Name, &shop.Location, &shop.ShopType, &shop.Followers, &shop.Rating,
	)

	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"product": p,
		"shop":    shop,
	})
}

func handleTriggerScrapeJob(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Type    string `json:"type"`
		Payload string `json:"payload"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := db.Exec(`INSERT INTO scrape_jobs (type, payload, status, run_at) VALUES (?, ?, 'pending', ?)`,
		req.Type, req.Payload, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jobID, _ := res.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Scrape job queued successfully",
		"job_id":  jobID,
	})
}

func handleNextScrapeJob(w http.ResponseWriter, r *http.Request) {
	var job ScrapeJob
	row := db.QueryRow(`
		SELECT id, type, payload, status, attempts, run_at
		FROM scrape_jobs
		WHERE status = 'pending'
		ORDER BY id ASC LIMIT 1`)

	err := row.Scan(&job.ID, &job.JobType, &job.Payload, &job.Status, &job.Attempts, &job.RunAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"job": nil})
		return
	}

	// Mark as running
	db.Exec(`UPDATE scrape_jobs SET status = 'running', locked_at = ? WHERE id = ?`, time.Now(), job.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"job": job})
}

func handleIngestScrapedData(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		JobID       int64   `json:"job_id"`
		ShopName    string  `json:"shop_name"`
		Marketplace string  `json:"marketplace"`
		Location    string  `json:"location"`
		ProductName string  `json:"product_name"`
		Brand       string  `json:"brand"`
		Category    string  `json:"category"`
		SKU         string  `json:"sku"`
		Price       float64 `json:"price"`
		TotalSold   int     `json:"total_sold"`
		Stock       int     `json:"stock"`
		Rating      float64 `json:"rating"`
		Reviews     int     `json:"review_count"`
		URL         string  `json:"url"`
		Image       string  `json:"image"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Get or Create Shop
	var shopID int64
	err := db.QueryRow("SELECT id FROM shops WHERE name = ?", payload.ShopName).Scan(&shopID)
	if err != nil {
		res, _ := db.Exec(`INSERT INTO shops (marketplace, name, location, shop_type, followers, rating) VALUES (?, ?, ?, 'Official Store', 10000, 4.9)`,
			payload.Marketplace, payload.ShopName, payload.Location)
		shopID, _ = res.LastInsertId()
	}

	// 2. Get or Create Product
	var productID int64
	err = db.QueryRow("SELECT id FROM products WHERE sku = ?", payload.SKU).Scan(&productID)
	if err != nil {
		res, _ := db.Exec(`INSERT INTO products (shop_id, name, brand, category, sku, url, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			shopID, payload.ProductName, payload.Brand, payload.Category, payload.SKU, payload.URL, payload.Image)
		productID, _ = res.LastInsertId()
	}

	// 3. Check previous snapshot to calculate daily sales (PRD F-08)
	var prevSold int
	_ = db.QueryRow("SELECT total_sold FROM product_snapshots WHERE product_id = ? ORDER BY id DESC LIMIT 1", productID).Scan(&prevSold)

	diffSold := 0
	if prevSold > 0 && payload.TotalSold >= prevSold {
		diffSold = payload.TotalSold - prevSold
	}

	// 4. Insert new Snapshot (PRD F-07)
	db.Exec(`INSERT INTO product_snapshots (product_id, captured_at, price, total_sold, stock, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		productID, time.Now(), payload.Price, payload.TotalSold, payload.Stock, payload.Rating, payload.Reviews)

	// 5. Insert Daily Sales
	if diffSold > 0 {
		db.Exec(`INSERT INTO daily_sales (product_id, tanggal, terjual_hari_itu) VALUES (?, ?, ?)`,
			productID, time.Now().Format("2006-01-02"), diffSold)
	}

	// 6. Complete Job if present
	if payload.JobID > 0 {
		db.Exec(`UPDATE scrape_jobs SET status = 'success' WHERE id = ?`, payload.JobID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "success",
		"product_id": productID,
		"daily_diff": diffSold,
	})
}

func FileServer(r chi.Router, path string, root http.FileSystem) {
	fs := http.StripPrefix(path, http.FileServer(root))
	r.Get(path+"*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	}))
}
