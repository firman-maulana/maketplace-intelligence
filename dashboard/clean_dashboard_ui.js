const fs = require('fs');
const path = require('path');

const pagesDir = 'd:/Next/marketplace-intelligence/dashboard/pages';
const files = ['index.html', 'app-ecommerce-product-list.html', 'app-ecommerce-product-detail.html'];

const cleanSidebar = `    <!-- Menu Intelligence -->
    <li class="menu-header small">
      <span class="menu-header-text">Marketplace Intelligence</span>
    </li>
    <li class="menu-item __INDEX_ACTIVE__">
      <a href="index.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-smart-home"></i>
        <div>Dashboard Analytics</div>
      </a>
    </li>
    <li class="menu-item __PRODUCT_ACTIVE__">
      <a href="app-ecommerce-product-list.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-trophy"></i>
        <div>Ranking Produk Terlaris</div>
      </a>
    </li>`;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  const menuStartIdx = html.indexOf('<ul class="menu-inner py-1">');
  const menuEndIdx = html.indexOf('</ul>\n    </aside>') !== -1 ? html.indexOf('</ul>\n    </aside>') : html.indexOf('</ul>\n</aside>');

  if (menuStartIdx !== -1 && menuEndIdx !== -1) {
    let sb = cleanSidebar;
    sb = sb.replace('__INDEX_ACTIVE__', file === 'index.html' ? 'active' : '');
    sb = sb.replace('__PRODUCT_ACTIVE__', (file === 'app-ecommerce-product-list.html' || file === 'app-ecommerce-product-detail.html') ? 'active' : '');

    html = html.substring(0, menuStartIdx + '<ul class="menu-inner py-1">\n'.length) + sb + '\n  ' + html.substring(menuEndIdx);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Cleaned sidebar in:', file);
  }
});

// Update index.html widgets: remove GMV and Omzet and Monitoring Scrape Jobs
let indexHtml = fs.readFileSync(path.join(pagesDir, 'index.html'), 'utf8');

// 1. Remove references to "Est. GMV" in slider
indexHtml = indexHtml.replace(/<p class="mb-0 fw-medium me-2 website-analytics-text-bg">4\.28M<\/p>\s*<p class="mb-0">Est\. GMV<\/p>/g,
  '<p class="mb-0 fw-medium me-2 website-analytics-text-bg">248.5k</p>\n                          <p class="mb-0">Unit Terjual</p>');

// 2. Average Daily Sales widget (PRD F-08) -> convert from Omzet to Daily Units Sold
indexHtml = indexHtml.replace(/<p class="mb-0 text-body">Omzet Pasar Bulan Ini<\/p>\s*<h4 class="mb-0">Rp 4\.28 Miliar<\/h4>/g,
  '<p class="mb-0 text-body">Total Unit Terjual Bulan Ini</p>\n          <h4 class="mb-0">1.842.000 Unit</h4>');
indexHtml = indexHtml.replace(/Estimasi Penjualan Harian/g, 'Volume Penjualan Harian (Unit)');

// 3. Earning Reports card -> convert to Volume Penjualan Snapshot
indexHtml = indexHtml.replace(/Performa Scraping Mingguan/g, 'Tren Penjualan Produk Mingguan');
indexHtml = indexHtml.replace(/Ringkasan Data Scraping 7 Hari Terakhir/g, 'Volume Unit Terjual Berdasarkan Snapshot Harian (F-08)');
indexHtml = indexHtml.replace(/Total produk berhasil di-scrape minggu ini vs minggu lalu/g, 'Total estimasi unit terjual minggu ini vs minggu lalu');
indexHtml = indexHtml.replace(/Sukses Scrape/g, 'Shopee Terjual');
indexHtml = indexHtml.replace(/Retry Jobs/g, 'Tokopedia Terjual');
indexHtml = indexHtml.replace(/Gagal \/ Error/g, 'Stok Terbatas');

// 4. Scraper Status Tracker widget -> convert to Distribusi Kategori Produk Terlaris
indexHtml = indexHtml.replace(/Scraper Status Tracker/g, 'Distribusi Kategori Produk Terlaris');
indexHtml = indexHtml.replace(/Status 7 Hari Terakhir/g, 'Berdasarkan Akumulasi Penjualan Harian');
indexHtml = indexHtml.replace(/1\.440/g, '10.420');
indexHtml = indexHtml.replace(/Total Scrape Jobs/g, 'Total Produk Dipantau');
indexHtml = indexHtml.replace(/Jobs Selesai/g, 'Elektronik & Gadget');
indexHtml = indexHtml.replace(/1\.320/g, '4.210 item');
indexHtml = indexHtml.replace(/Jobs Berjalan/g, 'Fashion & Pakaian');
indexHtml = indexHtml.replace(/84<\/small>/g, '3.890 item</small>');
indexHtml = indexHtml.replace(/Avg\. Durasi Scrape/g, 'Perlengkapan Rumah');
indexHtml = indexHtml.replace(/4\.2 menit/g, '2.320 item');

// 5. Replace "Top Kategori per Volume GMV" card -> Top Kategori per Volume Unit Terjual
indexHtml = indexHtml.replace(/Top Kategori per Volume GMV/g, 'Top Kategori Terpopuler');
indexHtml = indexHtml.replace(/Estimasi Volume GMV Bulanan per Kategori/g, 'Volume Unit Terjual Berdasarkan Snapshot');
indexHtml = indexHtml.replace(/Rp 1\.48 T/g, '42.800 Unit');
indexHtml = indexHtml.replace(/Rp 1\.82 T/g, '54.100 Unit');
indexHtml = indexHtml.replace(/Rp 980 M/g, '28.400 Unit');
indexHtml = indexHtml.replace(/Rp 620 M/g, '18.900 Unit');
indexHtml = indexHtml.replace(/Rp 410 M/g, '14.200 Unit');
indexHtml = indexHtml.replace(/Rp 285 M/g, '9.800 Unit');

// 6. Replace "Total GMV Terpantau" -> Total Unit Penjualan Terpantau
indexHtml = indexHtml.replace(/Total GMV Terpantau/g, 'Total Unit Terjual Terpantau');
indexHtml = indexHtml.replace(/Rp 5\.6T/g, '842.500 Unit');
indexHtml = indexHtml.replace(/GMV Shopee/g, 'Unit Terjual Shopee');
indexHtml = indexHtml.replace(/Rp 3\.84T/g, '577.100 Unit');
indexHtml = indexHtml.replace(/GMV Tokopedia/g, 'Unit Terjual Tokopedia');
indexHtml = indexHtml.replace(/Rp 1\.76T/g, '265.400 Unit');

// 7. Remove bottom "Scrape Jobs Monitoring table (PRD F-18)" from index.html
const tableStartIdx = indexHtml.indexOf('<!-- Scrape Jobs Monitoring table');
const tableEndIdx = indexHtml.indexOf('<!--/ Scrape Jobs Monitoring table -->');
if (tableStartIdx !== -1 && tableEndIdx !== -1) {
  indexHtml = indexHtml.substring(0, tableStartIdx) + indexHtml.substring(tableEndIdx + '<!--/ Scrape Jobs Monitoring table -->'.length);
  console.log('Removed Scrape Jobs Monitoring table from index.html');
}

fs.writeFileSync(path.join(pagesDir, 'index.html'), indexHtml, 'utf8');
console.log('Updated index.html successfully!');

// Clean up product-list.html top metrics (remove omzet)
let prodListHtml = fs.readFileSync(path.join(pagesDir, 'app-ecommerce-product-list.html'), 'utf8');
prodListHtml = prodListHtml.replace(/Estimasi Omzet Harian/g, 'Rata-rata Terjual Harian');
prodListHtml = prodListHtml.replace(/Rp 142\.8 Jt/g, '4.820 Unit/Hari');
prodListHtml = prodListHtml.replace(/Selisih snapshot 24j/g, 'Pertumbuhan Penjualan Harian');

// In datatable header, change Est. Terjual/Hari
fs.writeFileSync(path.join(pagesDir, 'app-ecommerce-product-list.html'), prodListHtml, 'utf8');
console.log('Updated app-ecommerce-product-list.html metrics!');

// Clean up product-detail.html (remove omzet, keep daily sales volume and pricing)
let prodDetailHtml = fs.readFileSync(path.join(pagesDir, 'app-ecommerce-product-detail.html'), 'utf8');
prodDetailHtml = prodDetailHtml.replace(/Estimasi Omzet 30 Hari/g, 'Total Terjual 30 Hari');
prodDetailHtml = prodDetailHtml.replace(/Rp 2\.71 Miliar/g, '5.520 Unit');
prodDetailHtml = prodDetailHtml.replace(/Total Gross Rp 12\.1 M/g, 'Akumulasi Snapshot');
prodDetailHtml = prodDetailHtml.replace(/Rp 3\.82 M<\/h5>\s*<span>Est\. Omzet Bulanan<\/span>/g, '54.210<\/h5>\n                <span>Total Unit Terjual<\/span>');
fs.writeFileSync(path.join(pagesDir, 'app-ecommerce-product-detail.html'), prodDetailHtml, 'utf8');
console.log('Updated app-ecommerce-product-detail.html metrics!');
