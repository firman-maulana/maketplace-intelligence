const fs = require('fs');
const path = require('path');

const pagesDir = 'd:/Next/marketplace-intelligence/dashboard/pages';

// 1. UPDATE app-ecommerce-customer-details-overview.html
const custFile = path.join(pagesDir, 'app-ecommerce-customer-details-overview.html');
if (fs.existsSync(custFile)) {
  let custHtml = fs.readFileSync(custFile, 'utf8');

  // Replace header & title info
  custHtml = custHtml.replace(/ID Toko Marketplace #634759/g, 'Official Store - Erigo Official (Shopee & Tokopedia)');
  custHtml = custHtml.replace(/Lorine Hischke/g, 'Erigo Official Store');
  custHtml = custHtml.replace(/Delete Toko/g, 'Hentikan Pantauan Toko');
  custHtml = custHtml.replace(/Aug 17, 2020, 5:48 \(ET\)/g, 'Terakhir Ter-scrape: Hari ini 14:15 WIB');
  
  // Replace store left sidebar info
  custHtml = custHtml.replace(/184<\/h5>\s*<span>Orders<\/span>/g, '54.210</h5>\n                <span>Total Terjual (Unit)</span>');
  custHtml = custHtml.replace(/\$12,378<\/h5>\s*<span>Spent<\/span>/g, 'Rp 3.82 M</h5>\n                <span>Est. Omzet Bulanan</span>');
  custHtml = custHtml.replace(/Username:<\/span>\s*<span>lorine\.hischke<\/span>/g, 'Platform:</span>\n                <span class="badge bg-label-warning">Shopee Mall</span> <span class="badge bg-label-success">Tokopedia Official</span>');
  custHtml = custHtml.replace(/Email:<\/span>\s*<span>vafgot@vultukir\.org<\/span>/g, 'Rating Toko:</span>\n                <span>⭐ 4.88 / 5.0 (142k review)</span>');
  custHtml = custHtml.replace(/Contact:<\/span>\s*<span>\(123\) 456-7890<\/span>/g, 'Lokasi Gudang:</span>\n                <span>Kab. Tangerang, Banten</span>');
  custHtml = custHtml.replace(/Country:<\/span>\s*<span>USA<\/span>/g, 'Total SKU:</span>\n                <span>412 Produk Aktif</span>');
  custHtml = custHtml.replace(/Edit Details/g, 'Edit Parameter Pantauan');

  // Replace upgrade premium card
  custHtml = custHtml.replace(/Upgrade to premium/g, 'Ekspor Laporan Toko');
  custHtml = custHtml.replace(/Upgrade toko to premium membership to access pro features\./g, 'Unduh riwayat pergerakan harga, estimasi omzet, dan ranking produk kompetitor ini.');
  custHtml = custHtml.replace(/<button class="btn btn-white text-primary w-100 fw-medium shadow-xs" data-bs-target="#upgradePlanModal" data-bs-toggle="modal">Upgrade to premium<\/button>/g, '<button class="btn btn-white text-primary w-100 fw-medium shadow-xs"><i class="icon-base ti tabler-download me-1"></i>Unduh CSV / PDF</button>');

  // Replace pills
  custHtml = custHtml.replace(/<a class="nav-link" href="app-ecommerce-toko-details-security\.html"><i class="icon-base ti tabler-lock icon-sm me-1_5"><\/i>Security<\/a>/g, '<a class="nav-link" href="javascript:void(0);"><i class="icon-base ti tabler-chart-line icon-sm me-1_5"></i>Riwayat Harga & Diskon</a>');
  custHtml = custHtml.replace(/<a class="nav-link" href="app-ecommerce-toko-details-billing\.html"><i class="icon-base ti tabler-map-pin icon-sm me-1_5"><\/i>Address & Billing<\/a>/g, '<a class="nav-link" href="javascript:void(0);"><i class="icon-base ti tabler-box icon-sm me-1_5"></i>Daftar SKU & Stok</a>');
  custHtml = custHtml.replace(/<a class="nav-link" href="app-ecommerce-toko-details-notifications\.html"><i class="icon-base ti tabler-bell icon-sm me-1_5"><\/i>Notifications<\/a>/g, '<a class="nav-link" href="javascript:void(0);"><i class="icon-base ti tabler-alert-triangle icon-sm me-1_5"></i>Log Price Change Alert</a>');

  // Replace 4 stat cards
  custHtml = custHtml.replace(/Account Balance/g, 'Estimasi GMV 30 Hari');
  custHtml = custHtml.replace(/\$2345/g, 'Rp 3.820.500.000');
  custHtml = custHtml.replace(/Credit Left/g, '+18.4% MoM');
  custHtml = custHtml.replace(/Account balance for next purchase/g, 'Berdasarkan snapshot selisih terjual Shopee & Tokped');

  custHtml = custHtml.replace(/Loyalty Program/g, 'Status Kompetitor');
  custHtml = custHtml.replace(/Platinum member/g, 'Kompetitor Utama (Tier 1)');
  custHtml = custHtml.replace(/3000 points to next tier/g, 'Share pasar kategori Fashion Pria: 24.5%');

  custHtml = custHtml.replace(/Wishlist/g, 'Produk Terpantau');
  custHtml = custHtml.replace(/<h5 class="text-warning mb-0">15<\/h5>/g, '<h5 class="text-warning mb-0">412 SKU</h5>');
  custHtml = custHtml.replace(/Items in wishlist/g, 'Aktif Ter-scrape');
  custHtml = custHtml.replace(/Receive notification when items go on sale/g, 'Update interval: Setiap 6 Jam (Scraper Job F-18)');

  custHtml = custHtml.replace(/Coupons/g, 'Perubahan Harga Bulan Ini');
  custHtml = custHtml.replace(/<h5 class="text-info mb-0">21<\/h5>/g, '<h5 class="text-info mb-0">34 Event</h5>');
  custHtml = custHtml.replace(/Coupons you win/g, 'Price Alert Triggered');
  custHtml = custHtml.replace(/Use coupon on next purchase/g, 'Terdeteksi promo flash sale & penyesuaian diskon');

  // Table header replacements inside customer overview
  custHtml = custHtml.replace(/<th>Orders<\/th>/g, '<th>ID Produk / SKU</th>');
  custHtml = custHtml.replace(/<th>Date<\/th>/g, '<th>Nama Produk Terlaris</th>');
  custHtml = custHtml.replace(/<th>Status<\/th>/g, '<th>Harga Snapshot</th>');
  custHtml = custHtml.replace(/<th>Spent<\/th>/g, '<th>Est. Terjual/Hari</th>');

  fs.writeFileSync(custFile, custHtml, 'utf8');
  console.log('Updated app-ecommerce-customer-details-overview.html');
}

// 2. UPDATE app-logistics-dashboard.html (Scraper & Data Pipeline Monitoring)
const logDashFile = path.join(pagesDir, 'app-logistics-dashboard.html');
if (fs.existsSync(logDashFile)) {
  let logHtml = fs.readFileSync(logDashFile, 'utf8');

  // Replace worker cards
  logHtml = logHtml.replace(/On route workers/g, 'Scraper Workers Aktif');
  logHtml = logHtml.replace(/Workers with errors/g, 'Scraper Jobs Gagal / Error');
  logHtml = logHtml.replace(/Rate-Limited \/ Captcha Triggered/g, 'Captcha / Rate-Limited (Anti-Bot)');
  logHtml = logHtml.replace(/Late workers/g, 'Pending / Antrean Jobs');

  // Replace overview labels
  logHtml = logHtml.replace(/On the way/g, 'Crawling Shopee');
  logHtml = logHtml.replace(/Unloading/g, 'Crawling Tokopedia');
  logHtml = logHtml.replace(/Loading/g, 'Data Cleaning / ETL');
  logHtml = logHtml.replace(/Waiting/g, 'Idling / Standby');

  fs.writeFileSync(logDashFile, logHtml, 'utf8');
  console.log('Updated app-logistics-dashboard.html');
}

// 3. UPDATE app-logistics-fleet.html (Node & Worker Monitoring F-19)
const fleetFile = path.join(pagesDir, 'app-logistics-fleet.html');
if (fs.existsSync(fleetFile)) {
  let fleetHtml = fs.readFileSync(fleetFile, 'utf8');

  fleetHtml = fleetHtml.replace(/Node Manager/g, 'Scraper Worker Nodes (F-19)');
  fleetHtml = fleetHtml.replace(/VOL-342808/g, 'Node-Worker-01 (Playwright Cluster)');
  fleetHtml = fleetHtml.replace(/Chelsea, NY, USA/g, 'IP Proxy: SG-Residential-04 • Shopee Worker');
  fleetHtml = fleetHtml.replace(/Delivery Process/g, 'Target Snapshot Kategori Selesai');
  fleetHtml = fleetHtml.replace(/tracking number created/g, 'Job Init & Proxy Rotation');
  fleetHtml = fleetHtml.replace(/Veronica Herman/g, 'Shopee Crawler Module v2.4');
  fleetHtml = fleetHtml.replace(/out for delivery/g, 'Bypassing Cloudflare & Scraping DOM');
  fleetHtml = fleetHtml.replace(/arriving/g, 'Ingesting Data to PostgreSQL');

  fleetHtml = fleetHtml.replace(/VOL-954784/g, 'Node-Worker-02 (Tokopedia GraphQL)');
  fleetHtml = fleetHtml.replace(/Lincoln Harbor, NY, USA/g, 'IP Proxy: ID-Telkom-02 • Tokopedia Worker');

  fs.writeFileSync(fleetFile, fleetHtml, 'utf8');
  console.log('Updated app-logistics-fleet.html');
}

// 4. UPDATE app-ecommerce-category-list.html
const catFile = path.join(pagesDir, 'app-ecommerce-category-list.html');
if (fs.existsSync(catFile)) {
  let catHtml = fs.readFileSync(catFile, 'utf8');

  catHtml = catHtml.replace(/Tambah Filter Kategori/g, 'Tambah Monitoring Kategori');
  catHtml = catHtml.replace(/<label class="form-label" for="ecommerce-category-title">Title<\/label>/g, '<label class="form-label" for="ecommerce-category-title">Nama Kategori Marketplace</label>');
  catHtml = catHtml.replace(/placeholder="Enter category title"/g, 'placeholder="contoh: Handphone & Aksesoris"');
  catHtml = catHtml.replace(/<label class="form-label" for="ecommerce-category-slug">Slug<\/label>/g, '<label class="form-label" for="ecommerce-category-slug">URL / Slug Kategori</label>');
  catHtml = catHtml.replace(/placeholder="Enter slug"/g, 'placeholder="contoh: handphone-aksesoris"');
  catHtml = catHtml.replace(/<label class="form-label" for="ecommerce-category-parent-category">Parent category<\/label>/g, '<label class="form-label" for="ecommerce-category-parent-category">Marketplace Target</label>');
  catHtml = catHtml.replace(/Select parent category/g, 'Pilih Marketplace');
  catHtml = catHtml.replace(/<option value="Household">Household<\/option>[\s\S]*?<option value="Automotive">Automotive<\/option>/g, '<option value="Shopee">Shopee Indonesia</option>\n              <option value="Tokopedia">Tokopedia</option>\n              <option value="Both">Shopee & Tokopedia</option>');

  fs.writeFileSync(catFile, catHtml, 'utf8');
  console.log('Updated app-ecommerce-category-list.html');
}

// 5. UPDATE app-ecommerce-customer-all.html (Daftar Toko Kompetitor)
const allCustFile = path.join(pagesDir, 'app-ecommerce-customer-all.html');
if (fs.existsSync(allCustFile)) {
  let allCustHtml = fs.readFileSync(allCustFile, 'utf8');

  allCustHtml = allCustHtml.replace(/<th>Customer<\/th>/g, '<th>Toko & Official Store</th>');
  allCustHtml = allCustHtml.replace(/<th class="text-nowrap">Customer Id<\/th>/g, '<th class="text-nowrap">ID Toko & Marketplace</th>');
  allCustHtml = allCustHtml.replace(/<th>Country<\/th>/g, '<th>Kota / Lokasi</th>');
  allCustHtml = allCustHtml.replace(/<th>Order<\/th>/g, '<th>Total Terjual (Unit)</th>');

  allCustHtml = allCustHtml.replace(/<h6 class="mb-6">Basic Information<\/h6>/g, '<h6 class="mb-6">Informasi Toko Kompetitor</h6>');
  allCustHtml = allCustHtml.replace(/<label class="form-label" for="ecommerce-customer-add-name">Name\*<\/label>/g, '<label class="form-label" for="ecommerce-customer-add-name">Nama Toko Kompetitor*</label>');
  allCustHtml = allCustHtml.replace(/placeholder="Admin Rankwise"/g, 'placeholder="contoh: Erigo Official Store"');
  allCustHtml = allCustHtml.replace(/<label class="form-label" for="ecommerce-customer-add-email">Email\*<\/label>/g, '<label class="form-label" for="ecommerce-customer-add-email">URL Profil Toko Marketplace*</label>');
  allCustHtml = allCustHtml.replace(/placeholder="john\.doe@example\.com"/g, 'placeholder="https://shopee.co.id/erigo.official"');
  allCustHtml = allCustHtml.replace(/<label class="form-label" for="ecommerce-customer-add-contact">Mobile<\/label>/g, '<label class="form-label" for="ecommerce-customer-add-contact">Kategori Utama</label>');
  allCustHtml = allCustHtml.replace(/placeholder="\+\(123\) 456-7890"/g, 'placeholder="contoh: Fashion Pria"');

  allCustHtml = allCustHtml.replace(/<h6 class="mb-6">Shipping Information<\/h6>[\s\S]*?<\/div>\s*<\/div>\s*<div class="d-sm-flex mb-6">/g, `<h6 class="mb-6">Frekuensi Scraping</h6>
            <div class="mb-6">
              <label class="form-label">Interval Snapshot Data</label>
              <select class="form-select">
                <option value="6h">Setiap 6 Jam (Rekomendasi Flash Sale)</option>
                <option value="12h">Setiap 12 Jam</option>
                <option value="24h">Setiap 24 Jam (Harian)</option>
              </select>
            </div>
            <div class="mb-6">
              <label class="form-label">Alert Perubahan Harga</label>
              <div class="form-check form-switch">
                <input type="checkbox" class="form-check-input" checked id="alertPriceSwitch" />
                <label class="form-check-label" for="alertPriceSwitch">Notifikasi jika kompetitor ubah harga > 10%</label>
              </div>
            </div>
          </div>
          <div class="d-sm-flex mb-6">`);

  fs.writeFileSync(allCustFile, allCustHtml, 'utf8');
  console.log('Updated app-ecommerce-customer-all.html');
}

// 6. UPDATE app-ecommerce-manage-reviews.html (Analisis Rating & Review Produk)
const revFile = path.join(pagesDir, 'app-ecommerce-manage-reviews.html');
if (fs.existsSync(revFile)) {
  let revHtml = fs.readFileSync(revFile, 'utf8');

  revHtml = revHtml.replace(/Total 187 reviews/g, 'Total 24.180 Ulasan Dipantau');
  revHtml = revHtml.replace(/All reviews are from genuine customers/g, 'Sentimen Ulasan Shopee & Tokopedia');
  revHtml = revHtml.replace(/\+5 This week/g, '+1.420 Ulasan Baru');
  revHtml = revHtml.replace(/Reviews statistics/g, 'Statistik Sentimen Ulasan');
  revHtml = revHtml.replace(/12 New reviews/g, '3.240 Review 24 Jam');
  revHtml = revHtml.replace(/Weekly Report/g, 'Laporan Sentimen AI');
  revHtml = revHtml.replace(/Positive reviews/g, 'Sentimen Positif (Puas)');

  revHtml = revHtml.replace(/<th>Product<\/th>/g, '<th>Produk & Marketplace</th>');
  revHtml = revHtml.replace(/<th class="text-nowrap">Reviewer<\/th>/g, '<th class="text-nowrap">Pembeli / Reviewer</th>');
  revHtml = revHtml.replace(/<th>Review<\/th>/g, '<th>Rating & Isi Ulasan</th>');
  revHtml = revHtml.replace(/<th>Date<\/th>/g, '<th>Waktu Crawl</th>');
  revHtml = revHtml.replace(/<th class="text-nowrap">Status<\/th>/g, '<th class="text-nowrap">Sentimen AI</th>');

  fs.writeFileSync(revFile, revHtml, 'utf8');
  console.log('Updated app-ecommerce-manage-reviews.html');
}

// 7. UPDATE app-ecommerce-dashboard.html (Estimasi Omzet & Tren Kategori)
const dashFile = path.join(pagesDir, 'app-ecommerce-dashboard.html');
if (fs.existsSync(dashFile)) {
  let dashHtml = fs.readFileSync(dashFile, 'utf8');

  dashHtml = dashHtml.replace(/Congratulations John! 🎉/g, 'Marketplace Leader: Fashion & Aksesoris');
  dashHtml = dashHtml.replace(/Best seller of the month/g, 'Kategori Omzet Terbesar Bulan Ini');
  dashHtml = dashHtml.replace(/\$48\.9k/g, 'Rp 1.84 Miliar');
  dashHtml = dashHtml.replace(/View Sales/g, 'Lihat Tren Produk');

  dashHtml = dashHtml.replace(/Updated 1 month ago/g, 'Snapshot Terakhir: Hari ini 14:00 WIB');
  dashHtml = dashHtml.replace(/<small>Sales<\/small>/g, '<small>Total Item Terjual</small>');
  dashHtml = dashHtml.replace(/<small>Customers<\/small>/g, '<small>Toko Aktif</small>');
  dashHtml = dashHtml.replace(/8\.549k/g, '840 Toko');
  dashHtml = dashHtml.replace(/230k/g, '148.2k Unit');
  dashHtml = dashHtml.replace(/1\.423k/g, '10.420');
  dashHtml = dashHtml.replace(/\$9745/g, 'Rp 142.8 Jt');

  dashHtml = dashHtml.replace(/<h5 class="card-title mb-1">Margin<\/h5>/g, '<h5 class="card-title mb-1">Estimasi Gross Margin<\/h5>');
  dashHtml = dashHtml.replace(/<p class="card-subtitle">Last Month<\/p>/g, '<p class="card-subtitle">Rata-rata Margin Kategori<\/p>');
  dashHtml = dashHtml.replace(/<h4 class="mb-0">624k<\/h4>/g, '<h4 class="mb-0">28.4%</h4>');

  dashHtml = dashHtml.replace(/<h5 class="card-title mb-1">82\.5k<\/h5>/g, '<h5 class="card-title mb-1">Rp 4.28 M<\/h5>');
  dashHtml = dashHtml.replace(/<p class="card-subtitle">Biaya Operasional<\/p>/g, '<p class="card-subtitle">Total GMV Pasar Bulan Ini</p>');

  fs.writeFileSync(dashFile, dashHtml, 'utf8');
  console.log('Updated app-ecommerce-dashboard.html');
}

console.log('ALL DASHBOARD PAGES CUSTOMIZED SUCCESSFULLY!');
