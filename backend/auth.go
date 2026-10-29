package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var (
	db          *sql.DB
	jwtSecret   = []byte("rankwise_marketplace_intel_super_secret_key_2026")
	googleAppID = "401944157094-81bs6bm6loldgtma4lva3e2vu1r66ih9.apps.googleusercontent.com"
)

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	GoogleID     string    `json:"google_id,omitempty"`
	Avatar       string    `json:"avatar"`
	Role         string    `json:"role"`   // "admin" atau "user"
	Status       string    `json:"status"` // "active" atau "inactive"
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ActivityLog struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Username  string    `json:"username"`
	Role      string    `json:"role"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	IPAddress string    `json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	User    *User  `json:"user,omitempty"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email"`
	Password        string `json:"password"`
}

type GoogleAuthRequest struct {
	Credential string `json:"credential"` // ID Token dari Google GIS
}

// In-memory fallback if MySQL not connected yet
type MemUserStore struct {
	mu         sync.RWMutex
	users      map[string]*User // key: email/username
	seq        int64
	settings   map[string]string
	activities []ActivityLog
}

var memUsers = &MemUserStore{
	users:      make(map[string]*User),
	seq:        1,
	settings:   make(map[string]string),
	activities: make([]ActivityLog, 0),
}

func initDB() {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "root:@tcp(127.0.0.1:3306)/marketplace_intelligence?charset=utf8mb4&parseTime=True&loc=Local"
	}

	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Printf("[MySQL Info] Gagal inisialisasi driver MySQL: %v. Menggunakan in-memory fallback.", err)
		seedDefaultAdminMem()
		return
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err = db.Ping(); err != nil {
		log.Printf("[MySQL Info] MySQL belum terhubung (%v). Sistem tetap berjalan dengan in-memory authentication.", err)
		seedDefaultAdminMem()
		return
	}

	log.Println("[MySQL Success] Berhasil terhubung ke database MySQL (phpMyAdmin)!")

	// 1. Table users
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(100) NOT NULL UNIQUE,
		email VARCHAR(191) NOT NULL UNIQUE,
		password_hash VARCHAR(255) NULL,
		google_id VARCHAR(191) NULL UNIQUE,
		avatar VARCHAR(255) NULL,
		role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
		status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		log.Printf("[MySQL Warning] Tabel users: %v", err)
	}

	// 2. Table settings (Dynamic API keys: Apify & Fonnte)
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS settings (
		setting_key VARCHAR(100) PRIMARY KEY,
		setting_value TEXT NOT NULL,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		log.Printf("[MySQL Warning] Tabel settings: %v", err)
	}

	// 3. Table products (Persistence for scraped marketplace products)
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS products (
		id BIGINT PRIMARY KEY AUTO_INCREMENT,
		user_id BIGINT DEFAULT 0,
		shop_id BIGINT DEFAULT 0,
		name VARCHAR(500) NOT NULL,
		brand VARCHAR(255) DEFAULT '',
		category VARCHAR(100) DEFAULT '',
		sku VARCHAR(100) DEFAULT '',
		url TEXT,
		image TEXT,
		price DOUBLE DEFAULT 0,
		original_price DOUBLE DEFAULT 0,
		discount VARCHAR(50) DEFAULT '',
		stock INT DEFAULT 0,
		stock_status VARCHAR(50) DEFAULT 'In_Stock',
		total_sold INT DEFAULT 0,
		daily_sold INT DEFAULT 0,
		quantity INT DEFAULT 0,
		rating DOUBLE DEFAULT 5.0,
		review_count INT DEFAULT 0,
		status INT DEFAULT 2,
		marketplace VARCHAR(50) DEFAULT 'tokopedia',
		shop_name VARCHAR(255) DEFAULT '',
		shop_location VARCHAR(255) DEFAULT '',
		description TEXT,
		raw_json LONGTEXT,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		log.Printf("[MySQL Warning] Tabel products: %v", err)
	}
	_, _ = db.Exec("ALTER TABLE products ADD COLUMN user_id BIGINT DEFAULT 0;")

	// 4. Table schedule_config
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS schedule_config (
		id INT PRIMARY KEY,
		enabled TINYINT(1) DEFAULT 0,
		keywords VARCHAR(255) DEFAULT '',
		category VARCHAR(100) DEFAULT 'Fashion',
		platforms VARCHAR(100) DEFAULT 'tokopedia,shopee',
		product_limit INT DEFAULT 25,
		frequency VARCHAR(50) DEFAULT 'daily',
		execution_time VARCHAR(20) DEFAULT '08:00',
		execution_date VARCHAR(20) DEFAULT '',
		whatsapp_number VARCHAR(50) DEFAULT '',
		fonnte_token VARCHAR(255) DEFAULT '',
		next_run DATETIME NULL,
		last_status TEXT,
		user_id BIGINT DEFAULT 0,
		username VARCHAR(100) DEFAULT '',
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		log.Printf("[MySQL Warning] Tabel schedule_config: %v", err)
	}
	_, _ = db.Exec("ALTER TABLE schedule_config ADD COLUMN user_id BIGINT DEFAULT 0;")
	_, _ = db.Exec("ALTER TABLE schedule_config ADD COLUMN username VARCHAR(100) DEFAULT '';")

	// 5. Table schedule_logs
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS schedule_logs (
		id INT PRIMARY KEY AUTO_INCREMENT,
		log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		target_date VARCHAR(255),
		target_time VARCHAR(20),
		category VARCHAR(100),
		total_products INT DEFAULT 0,
		status TEXT,
		whatsapp_status VARCHAR(255),
		user_id BIGINT DEFAULT 0,
		username VARCHAR(100) DEFAULT ''
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		log.Printf("[MySQL Warning] Tabel schedule_logs: %v", err)
	}
	_, _ = db.Exec("ALTER TABLE schedule_logs MODIFY COLUMN status TEXT;")
	_, _ = db.Exec("ALTER TABLE schedule_logs MODIFY COLUMN target_date VARCHAR(255);")
	_, _ = db.Exec("ALTER TABLE schedule_logs MODIFY COLUMN whatsapp_status VARCHAR(255);")
	_, _ = db.Exec("ALTER TABLE schedule_logs ADD COLUMN user_id BIGINT DEFAULT 0;")
	_, _ = db.Exec("ALTER TABLE schedule_logs ADD COLUMN username VARCHAR(100) DEFAULT '';")

	// 6. Table user_activities (Activity log persistence)
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS user_activities (
		id BIGINT PRIMARY KEY AUTO_INCREMENT,
		user_id BIGINT DEFAULT 0,
		username VARCHAR(100) DEFAULT '',
		role VARCHAR(50) DEFAULT 'user',
		action VARCHAR(100) NOT NULL,
		details TEXT,
		ip_address VARCHAR(50) DEFAULT '',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		log.Printf("[MySQL Warning] Tabel user_activities: %v", err)
	}

	seedDefaultAdminSQL()
	seedDefaultSettingsSQL()
}

func seedDefaultAdminMem() {
	memUsers.mu.Lock()
	defer memUsers.mu.Unlock()
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), 10)
	adminUser := &User{
		ID:           1,
		Username:     "admin",
		Email:        "admin@marketplace.com",
		PasswordHash: string(hash),
		Role:         "admin",
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	memUsers.users["admin"] = adminUser
	memUsers.users["admin@marketplace.com"] = adminUser
	memUsers.settings["apify_token"] = os.Getenv("APIFY_TOKEN")
	memUsers.settings["fonnte_token"] = "az37kgXqk6cUah5K1dNq"
}

func seedDefaultAdminSQL() {
	if db == nil {
		return
	}
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'admin'").Scan(&count)
	if err == nil && count == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), 10)
		_, _ = db.Exec(`INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'active')`,
			"admin", "admin@marketplace.com", string(hash))
		log.Println("[MySQL Seed] Akun admin default 'admin' (password: admin123) berhasil dibuat di tabel users.")
	}
}

func seedDefaultSettingsSQL() {
	if db == nil {
		return
	}
	// Seed Apify token if absent
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM settings WHERE setting_key = 'apify_token'").Scan(&count)
	if count == 0 {
		defaultToken := os.Getenv("APIFY_TOKEN")
		_, _ = db.Exec("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)",
			"apify_token", defaultToken)
	}

	// Seed Fonnte token if absent
	_ = db.QueryRow("SELECT COUNT(*) FROM settings WHERE setting_key = 'fonnte_token'").Scan(&count)
	if count == 0 {
		_, _ = db.Exec("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)",
			"fonnte_token", "az37kgXqk6cUah5K1dNq")
	}
}

// Settings Helpers
func getSetting(key, defaultValue string) string {
	if db != nil && db.Ping() == nil {
		var val string
		err := db.QueryRow("SELECT setting_value FROM settings WHERE setting_key = ?", key).Scan(&val)
		if err == nil && strings.TrimSpace(val) != "" {
			return strings.TrimSpace(val)
		}
	}
	memUsers.mu.RLock()
	val, ok := memUsers.settings[key]
	memUsers.mu.RUnlock()
	if ok && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return defaultValue
}

func setSetting(key, value string) error {
	value = strings.TrimSpace(value)
	if db != nil && db.Ping() == nil {
		_, err := db.Exec(`INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) 
			ON DUPLICATE KEY UPDATE setting_value = ?`, key, value, value)
		if err != nil {
			return err
		}
	}
	memUsers.mu.Lock()
	memUsers.settings[key] = value
	memUsers.mu.Unlock()
	return nil
}

func getApifyToken() string {
	token := getSetting("apify_token", "")
	if token == "" {
		token = os.Getenv("APIFY_TOKEN")
	}
	return token
}

func getFonnteToken() string {
	return getSetting("fonnte_token", "az37kgXqk6cUah5K1dNq")
}

// Activity Logging Helper
func recordActivity(userID int64, username, role, action, details, ip string) {
	log.Printf("[Activity] User: %s (%s) | Action: %s | %s", username, role, action, details)

	item := ActivityLog{
		UserID:    userID,
		Username:  username,
		Role:      role,
		Action:    action,
		Details:   details,
		IPAddress: ip,
		CreatedAt: time.Now(),
	}

	if db != nil && db.Ping() == nil {
		_, _ = db.Exec(`INSERT INTO user_activities (user_id, username, role, action, details, ip_address) 
			VALUES (?, ?, ?, ?, ?, ?)`, userID, username, role, action, details, ip)
	}

	memUsers.mu.Lock()
	memUsers.activities = append([]ActivityLog{item}, memUsers.activities...)
	if len(memUsers.activities) > 100 {
		memUsers.activities = memUsers.activities[:100]
	}
	memUsers.mu.Unlock()
}

// Generate secure signature token
func createToken(u *User) string {
	payload := fmt.Sprintf("%d|%s|%s|%d", u.ID, u.Role, u.Email, time.Now().Add(7*24*time.Hour).Unix())
	h := hmac.New(sha256.New, jwtSecret)
	h.Write([]byte(payload))
	sig := base64.URLEncoding.EncodeToString(h.Sum(nil))
	tokenData := base64.URLEncoding.EncodeToString([]byte(payload))
	return fmt.Sprintf("%s.%s", tokenData, sig)
}

func parseToken(tokenStr string) (int64, string, string, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 2 {
		return 0, "", "", fmt.Errorf("token format invalid")
	}

	payloadBytes, err := base64.URLEncoding.DecodeString(parts[0])
	if err != nil {
		return 0, "", "", err
	}

	h := hmac.New(sha256.New, jwtSecret)
	h.Write(payloadBytes)
	expectedSig := base64.URLEncoding.EncodeToString(h.Sum(nil))
	if !hmac.Equal([]byte(expectedSig), []byte(parts[1])) {
		return 0, "", "", fmt.Errorf("invalid signature")
	}

	var id int64
	var role, email string
	var exp int64
	_, err = fmt.Sscanf(string(payloadBytes), "%d|%s|%s|%d", &id, &role, &email, &exp)
	if err != nil {
		chunks := strings.Split(string(payloadBytes), "|")
		if len(chunks) == 4 {
			fmt.Sscanf(chunks[0], "%d", &id)
			role = chunks[1]
			email = chunks[2]
			fmt.Sscanf(chunks[3], "%d", &exp)
		} else {
			return 0, "", "", fmt.Errorf("corrupt payload")
		}
	}

	if time.Now().Unix() > exp {
		return 0, "", "", fmt.Errorf("token expired")
	}

	return id, role, email, nil
}

// Handler Register Manual
func handleRegister(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Format data pendaftaran tidak valid"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Username == "" || req.Email == "" || len(req.Password) < 6 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Data tidak lengkap atau password kurang dari 6 karakter"})
		return
	}

	// 1. Simpan di MySQL jika aktif
	if db != nil && db.Ping() == nil {
		var exists int
		_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?", req.Username, req.Email).Scan(&exists)
		if exists > 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Username atau Email sudah terdaftar"})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Gagal memproses kata sandi"})
			return
		}

		res, err := db.Exec(`INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'user', 'active')`,
			req.Username, req.Email, string(hash))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Gagal menyimpan akun ke basis data: " + err.Error()})
			return
		}

		newID, _ := res.LastInsertId()
		u := &User{
			ID:        newID,
			Username:  req.Username,
			Email:     req.Email,
			Role:      "user",
			Status:    "active",
			CreatedAt: time.Now(),
		}
		token := createToken(u)
		recordActivity(u.ID, u.Username, u.Role, "Pendaftaran Akun", "Pengguna mendaftar secara manual", r.RemoteAddr)

		json.NewEncoder(w).Encode(AuthResponse{
			Success: true,
			Message: "Pendaftaran berhasil!",
			Token:   token,
			User:    u,
		})
		return
	}

	// 2. Fallback In-Memory
	memUsers.mu.Lock()
	defer memUsers.mu.Unlock()

	if _, exists := memUsers.users[req.Username]; exists {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Username sudah terdaftar"})
		return
	}
	if _, exists := memUsers.users[req.Email]; exists {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Email sudah terdaftar"})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	memUsers.seq++
	newUser := &User{
		ID:           memUsers.seq,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         "user",
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	memUsers.users[req.Username] = newUser
	memUsers.users[req.Email] = newUser

	token := createToken(newUser)
	recordActivity(newUser.ID, newUser.Username, newUser.Role, "Pendaftaran Akun", "Pengguna mendaftar (In-Memory)", r.RemoteAddr)

	json.NewEncoder(w).Encode(AuthResponse{
		Success: true,
		Message: "Pendaftaran berhasil!",
		Token:   token,
		User:    newUser,
	})
}

// Handler Login Manual
func handleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Permintaan login tidak valid"})
		return
	}

	target := strings.TrimSpace(req.UsernameOrEmail)
	if target == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Email/username dan password harus diisi"})
		return
	}

	// 1. Cari di MySQL jika aktif
	if db != nil && db.Ping() == nil {
		var u User
		var hash string
		row := db.QueryRow("SELECT id, username, email, password_hash, role, status, created_at, updated_at FROM users WHERE username = ? OR email = ?", target, target)
		err := row.Scan(&u.ID, &u.Username, &u.Email, &hash, &u.Role, &u.Status, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			if u.Status == "inactive" {
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Akun Anda dinonaktifkan"})
				return
			}

			if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Password salah"})
				return
			}

			token := createToken(&u)
			recordActivity(u.ID, u.Username, u.Role, "Login Masuk", "Berhasil login ke sistem", r.RemoteAddr)

			json.NewEncoder(w).Encode(AuthResponse{
				Success: true,
				Message: "Login berhasil!",
				Token:   token,
				User:    &u,
			})
			return
		}
	}

	// 2. Fallback In-Memory
	memUsers.mu.RLock()
	user, exists := memUsers.users[target]
	memUsers.mu.RUnlock()

	if !exists {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Akun tidak ditemukan"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Password salah"})
		return
	}

	token := createToken(user)
	recordActivity(user.ID, user.Username, user.Role, "Login Masuk", "Berhasil login ke sistem (In-Memory)", r.RemoteAddr)

	json.NewEncoder(w).Encode(AuthResponse{
		Success: true,
		Message: "Login berhasil!",
		Token:   token,
		User:    user,
	})
}

// Handler Google Auth
type GoogleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
}

func handleGoogleAuth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Credential == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Credential Google tidak boleh kosong"})
		return
	}

	// Validasi credential token dengan Google
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + req.Credential)
	if err != nil || resp.StatusCode != http.StatusOK {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Verifikasi token Google gagal"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var gToken GoogleTokenInfo
	if err := json.Unmarshal(bodyBytes, &gToken); err != nil || gToken.Email == "" {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(AuthResponse{Success: false, Message: "Profil akun Google tidak valid"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(gToken.Email))
	googleSub := gToken.Sub
	displayName := gToken.Name
	if displayName == "" {
		displayName = strings.Split(email, "@")[0]
	}

	// 1. Sinkronisasi ke MySQL jika aktif
	if db != nil && db.Ping() == nil {
		var u User
		row := db.QueryRow("SELECT id, username, email, role, status, avatar FROM users WHERE google_id = ? OR email = ?", googleSub, email)
		err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.Status, &u.Avatar)

		if err == nil {
			// Update google_id & avatar jika belum ada
			_, _ = db.Exec("UPDATE users SET google_id = ?, avatar = ? WHERE id = ?", googleSub, gToken.Picture, u.ID)
			u.GoogleID = googleSub
			u.Avatar = gToken.Picture

			token := createToken(&u)
			recordActivity(u.ID, u.Username, u.Role, "Login Google", "Login via Google Sign-In", r.RemoteAddr)

			json.NewEncoder(w).Encode(AuthResponse{
				Success: true,
				Message: "Login Google berhasil!",
				Token:   token,
				User:    &u,
			})
			return
		}

		// User baru -> Otomatis Buat Akun
		usernameClean := strings.ReplaceAll(displayName, " ", "_")
		res, err := db.Exec(`INSERT INTO users (username, email, google_id, avatar, role, status) VALUES (?, ?, ?, ?, 'user', 'active')`,
			usernameClean, email, googleSub, gToken.Picture)
		if err != nil {
			usernameClean = fmt.Sprintf("%s_%d", usernameClean, time.Now().Unix()%1000)
			res, _ = db.Exec(`INSERT INTO users (username, email, google_id, avatar, role, status) VALUES (?, ?, ?, ?, 'user', 'active')`,
				usernameClean, email, googleSub, gToken.Picture)
		}

		newID, _ := res.LastInsertId()
		newUser := &User{
			ID:        newID,
			Username:  usernameClean,
			Email:     email,
			GoogleID:  googleSub,
			Avatar:    gToken.Picture,
			Role:      "user",
			Status:    "active",
			CreatedAt: time.Now(),
		}
		token := createToken(newUser)
		recordActivity(newUser.ID, newUser.Username, newUser.Role, "Registrasi Google", "Registrasi akun otomatis via Google Sign-In", r.RemoteAddr)

		json.NewEncoder(w).Encode(AuthResponse{
			Success: true,
			Message: "Pendaftaran Akun Google Berhasil!",
			Token:   token,
			User:    newUser,
		})
		return
	}

	// 2. Fallback In-Memory
	memUsers.mu.Lock()
	defer memUsers.mu.Unlock()

	user, exists := memUsers.users[email]
	if !exists {
		memUsers.seq++
		user = &User{
			ID:        memUsers.seq,
			Username:  displayName,
			Email:     email,
			GoogleID:  googleSub,
			Avatar:    gToken.Picture,
			Role:      "user",
			Status:    "active",
			CreatedAt: time.Now(),
		}
		memUsers.users[email] = user
		memUsers.users[displayName] = user
	}

	token := createToken(user)
	recordActivity(user.ID, user.Username, user.Role, "Login Google", "Login via Google Sign-In (In-Memory)", r.RemoteAddr)

	json.NewEncoder(w).Encode(AuthResponse{
		Success: true,
		Message: "Login Google Berhasil!",
		Token:   token,
		User:    user,
	})
}

// Handler Verifikasi Me
func handleGetMe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	authHeader := r.Header.Get("Authorization")
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenStr == "" {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Unauthorized"})
		return
	}

	id, role, email, err := parseToken(tokenStr)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Token expired atau invalid"})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":    id,
		"role":  role,
		"email": email,
	})
}

// ADMIN HANDLERS (Hanya dapat diakses role admin)
func adminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenStr == "" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Unauthorized: Token dibutuhkan"})
			return
		}

		_, role, _, err := parseToken(tokenStr)
		if err != nil || role != "admin" {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Forbidden: Hak akses khusus Admin"})
			return
		}

		next.ServeHTTP(w, r)
	})
}

// 1. READ: List all users with search & filters
func handleAdminGetUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	roleFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("role")))
	statusFilter := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("status")))

	var usersList []User
	if db != nil && db.Ping() == nil {
		query := "SELECT id, username, email, role, status, created_at FROM users WHERE 1=1"
		var args []interface{}

		if search != "" {
			query += " AND (LOWER(username) LIKE ? OR LOWER(email) LIKE ?)"
			likePattern := "%" + search + "%"
			args = append(args, likePattern, likePattern)
		}
		if roleFilter != "" && roleFilter != "all" {
			query += " AND role = ?"
			args = append(args, roleFilter)
		}
		if statusFilter != "" && statusFilter != "all" {
			query += " AND status = ?"
			args = append(args, statusFilter)
		}

		query += " ORDER BY id DESC"
		rows, err := db.Query(query, args...)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u User
				if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.Status, &u.CreatedAt); err == nil {
					usersList = append(usersList, u)
				}
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"users": usersList})
			return
		}
	}

	// Fallback Mem
	memUsers.mu.RLock()
	seen := make(map[int64]bool)
	for _, u := range memUsers.users {
		if !seen[u.ID] {
			seen[u.ID] = true
			if search != "" && !strings.Contains(strings.ToLower(u.Username), search) && !strings.Contains(strings.ToLower(u.Email), search) {
				continue
			}
			if roleFilter != "" && roleFilter != "all" && u.Role != roleFilter {
				continue
			}
			if statusFilter != "" && statusFilter != "all" && u.Status != statusFilter {
				continue
			}
			usersList = append(usersList, *u)
		}
	}
	memUsers.mu.RUnlock()

	json.NewEncoder(w).Encode(map[string]interface{}{"users": usersList})
}

// 2. CREATE: Admin Create User
func handleAdminCreateUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		Status   string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Payload data tidak valid"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Role = strings.ToLower(strings.TrimSpace(req.Role))
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))

	if req.Role != "admin" && req.Role != "user" {
		req.Role = "user"
	}
	if req.Status != "active" && req.Status != "inactive" {
		req.Status = "active"
	}

	if req.Username == "" || req.Email == "" || len(req.Password) < 6 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Username, email, dan password (min 6 karakter) wajib diisi"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Gagal mengenkripsi kata sandi"})
		return
	}

	if db != nil && db.Ping() == nil {
		var exists int
		_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?", req.Username, req.Email).Scan(&exists)
		if exists > 0 {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Username atau email sudah digunakan"})
			return
		}

		res, err := db.Exec(`INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
			req.Username, req.Email, string(hash), req.Role, req.Status)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": "Gagal menambahkan user: " + err.Error()})
			return
		}

		newID, _ := res.LastInsertId()
		recordActivity(newID, req.Username, req.Role, "Admin Buat User", fmt.Sprintf("Akun baru dibuat dengan role %s", req.Role), r.RemoteAddr)

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Pengguna baru berhasil ditambahkan!",
			"id":      newID,
		})
		return
	}

	// Fallback Mem
	memUsers.mu.Lock()
	memUsers.seq++
	newUser := &User{
		ID:           memUsers.seq,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         req.Role,
		Status:       req.Status,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	memUsers.users[req.Username] = newUser
	memUsers.users[req.Email] = newUser
	memUsers.mu.Unlock()

	recordActivity(newUser.ID, newUser.Username, newUser.Role, "Admin Buat User", fmt.Sprintf("Akun baru dibuat dengan role %s (In-Memory)", req.Role), r.RemoteAddr)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Pengguna baru berhasil ditambahkan!",
		"id":      newUser.ID,
	})
}

// 3. UPDATE: Admin Update User
func handleAdminUpdateUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	idStr := chi.URLParam(r, "id")
	var id int64
	fmt.Sscanf(idStr, "%d", &id)

	if id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "ID user tidak valid"})
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"` // optional
		Role     string `json:"role"`
		Status   string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Payload data tidak valid"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Role = strings.ToLower(strings.TrimSpace(req.Role))
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))

	if req.Role != "admin" && req.Role != "user" {
		req.Role = "user"
	}
	if req.Status != "active" && req.Status != "inactive" {
		req.Status = "active"
	}

	if db != nil && db.Ping() == nil {
		if strings.TrimSpace(req.Password) != "" {
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{"error": "Gagal mengenkripsi kata sandi"})
				return
			}
			_, err = db.Exec("UPDATE users SET username = ?, email = ?, password_hash = ?, role = ?, status = ? WHERE id = ?",
				req.Username, req.Email, string(hash), req.Role, req.Status, id)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{"error": err.Error()})
				return
			}
		} else {
			_, err := db.Exec("UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?",
				req.Username, req.Email, req.Role, req.Status, id)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{"error": err.Error()})
				return
			}
		}

		recordActivity(id, req.Username, req.Role, "Admin Edit User", fmt.Sprintf("Data akun diperbarui (Status: %s, Role: %s)", req.Status, req.Role), r.RemoteAddr)

		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Data pengguna berhasil diperbarui!",
		})
		return
	}

	// Fallback Mem
	memUsers.mu.Lock()
	for _, u := range memUsers.users {
		if u.ID == id {
			u.Username = req.Username
			u.Email = req.Email
			u.Role = req.Role
			u.Status = req.Status
			if strings.TrimSpace(req.Password) != "" {
				hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
				u.PasswordHash = string(hash)
			}
			u.UpdatedAt = time.Now()
		}
	}
	memUsers.mu.Unlock()

	recordActivity(id, req.Username, req.Role, "Admin Edit User", fmt.Sprintf("Data akun diperbarui (In-Memory)"), r.RemoteAddr)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Data pengguna berhasil diperbarui!",
	})
}

// 4. DELETE: Admin Delete User
func handleAdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	idStr := chi.URLParam(r, "id")
	var id int64
	fmt.Sscanf(idStr, "%d", &id)

	if id == 1 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Akun admin utama tidak boleh dihapus"})
		return
	}

	deletedUsername := fmt.Sprintf("User #%d", id)

	if db != nil && db.Ping() == nil {
		_ = db.QueryRow("SELECT username FROM users WHERE id = ?", id).Scan(&deletedUsername)
		_, err := db.Exec("DELETE FROM users WHERE id = ?", id)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"error": err.Error()})
			return
		}
	}

	memUsers.mu.Lock()
	for k, u := range memUsers.users {
		if u.ID == id {
			deletedUsername = u.Username
			delete(memUsers.users, k)
		}
	}
	memUsers.mu.Unlock()

	recordActivity(id, deletedUsername, "user", "Admin Hapus User", fmt.Sprintf("Akun %s telah dihapus", deletedUsername), r.RemoteAddr)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Pengguna berhasil dihapus secara permanen!",
	})
}

// 5. GET Settings: Get dynamic Apify & Fonnte tokens
func handleAdminGetSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	apifyToken := getApifyToken()
	fonnteToken := getFonnteToken()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"apify_token":  apifyToken,
		"fonnte_token": fonnteToken,
	})
}

// 6. UPDATE Settings: Save dynamic Apify & Fonnte tokens
func handleAdminUpdateSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var payload struct {
		ApifyToken  string `json:"apify_token"`
		FonnteToken string `json:"fonnte_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{"error": "Payload data tidak valid"})
		return
	}

	if payload.ApifyToken != "" {
		_ = setSetting("apify_token", payload.ApifyToken)
		_ = os.Setenv("APIFY_TOKEN", payload.ApifyToken)
	}

	if payload.FonnteToken != "" {
		_ = setSetting("fonnte_token", payload.FonnteToken)
		scheduleStore.mu.Lock()
		scheduleStore.config.FonnteToken = payload.FonnteToken
		scheduleStore.mu.Unlock()
	}

	recordActivity(0, "Administrator", "admin", "Update API Key", "Pengaturan API Key Apify & Fonnte diperbarui oleh admin", r.RemoteAddr)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Pengaturan API Key Apify & Fonnte berhasil disimpan secara permanen!",
	})
}

// 7. GET Activities: Real-time audit log (mendukung isolasi aktivitas per akun user)
func handleGetActivities(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var reqUserID int64
	var reqRole, reqUsername string

	authHeader := r.Header.Get("Authorization")
	tokenStr := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if tokenStr != "" {
		id, role, email, err := parseToken(tokenStr)
		if err == nil {
			reqUserID = id
			reqRole = role
			reqUsername = email
			if db != nil && db.Ping() == nil {
				var uname string
				if err := db.QueryRow("SELECT username FROM users WHERE id = ?", id).Scan(&uname); err == nil && uname != "" {
					reqUsername = uname
				}
			}
		}
	}

	if qID := r.URL.Query().Get("user_id"); qID != "" {
		fmt.Sscanf(qID, "%d", &reqUserID)
	}
	if qUname := r.URL.Query().Get("username"); qUname != "" {
		reqUsername = qUname
	}
	if qRole := r.URL.Query().Get("role"); qRole != "" {
		reqRole = qRole
	}

	var list []ActivityLog
	if db != nil && db.Ping() == nil {
		var query string
		var args []interface{}

		// Jika role adalah user biasa (bukan admin), hanya ambil aktivitas milik user tersebut
		if reqRole == "user" || (reqRole != "admin" && (reqUserID > 0 || reqUsername != "")) {
			query = "SELECT id, user_id, username, role, action, details, ip_address, created_at FROM user_activities WHERE (user_id = ? OR username = ?) ORDER BY id DESC LIMIT 50"
			args = append(args, reqUserID, reqUsername)
		} else {
			// Admin dapat melihat seluruh log sistem
			query = "SELECT id, user_id, username, role, action, details, ip_address, created_at FROM user_activities ORDER BY id DESC LIMIT 50"
		}

		rows, err := db.Query(query, args...)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var act ActivityLog
				if err := rows.Scan(&act.ID, &act.UserID, &act.Username, &act.Role, &act.Action, &act.Details, &act.IPAddress, &act.CreatedAt); err == nil {
					list = append(list, act)
				}
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"activities": list, "data": list})
			return
		}
	}

	memUsers.mu.RLock()
	for _, a := range memUsers.activities {
		if reqRole == "user" || (reqRole != "admin" && (reqUserID > 0 || reqUsername != "")) {
			if a.UserID == reqUserID || a.Username == reqUsername {
				list = append(list, a)
			}
		} else {
			list = append(list, a)
		}
	}
	memUsers.mu.RUnlock()

	json.NewEncoder(w).Encode(map[string]interface{}{"activities": list, "data": list})
}
