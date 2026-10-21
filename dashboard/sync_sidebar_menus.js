const fs = require('fs');
const path = require('path');

const pagesDir = 'd:/Next/marketplace-intelligence/dashboard/pages';
const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const standardMenu = `    <!-- Ringkasan Pasar -->
    <li class="menu-header small">
      <span class="menu-header-text">Ringkasan &amp; Tren Pasar</span>
    </li>
    <li class="menu-item __INDEX_ACTIVE__">
      <a href="index.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-smart-home"></i>
        <div>Dashboard Analytics</div>
      </a>
    </li>

    <!-- Riset Produk -->
    <li class="menu-header small">
      <span class="menu-header-text">Riset Produk &amp; Tren</span>
    </li>
    <li class="menu-item __PRODUCT_ACTIVE__">
      <a href="app-ecommerce-product-list.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-trophy"></i>
        <div>Ranking Produk Terlaris</div>
      </a>
    </li>

    <!-- Scraping & Monitoring (PRD F-18, F-19) -->
    <li class="menu-header small">
      <span class="menu-header-text">Scraper &amp; Data Pipeline</span>
    </li>
    <li class="menu-item __LOGISTICS_ACTIVE__">
      <a href="app-logistics-dashboard.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-cpu"></i>
        <div>Status Scrape Jobs (F-18)</div>
      </a>
    </li>
    <li class="menu-item __FLEET_ACTIVE__">
      <a href="app-logistics-fleet.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-activity"></i>
        <div>Monitoring Node &amp; Alert (F-19)</div>
      </a>
    </li>

    <!-- Pengguna & Pengaturan (PRD F-17) -->
    <li class="menu-header small">
      <span class="menu-header-text">Pengguna &amp; Akses</span>
    </li>
    <li class="menu-item __USER_ACTIVE__">
      <a href="app-user-list.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-users"></i>
        <div>Daftar Pengguna (F-17)</div>
      </a>
    </li>
    <li class="menu-item __ROLES_ACTIVE__">
      <a href="app-access-roles.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-shield-lock"></i>
        <div>Roles &amp; Permissions</div>
      </a>
    </li>
    <li class="menu-item __PERMISSION_ACTIVE__">
      <a href="app-access-permission.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-lock-access"></i>
        <div>Kelola Hak Akses</div>
      </a>
    </li>

    <li class="menu-header small">
      <span class="menu-header-text">Pengaturan Sistem</span>
    </li>
    <li class="menu-item __SETTINGS_ACTIVE__">
      <a href="pages-account-settings-account.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-settings"></i>
        <div>Pengaturan Akun</div>
      </a>
    </li>
    <li class="menu-item __BILLING_ACTIVE__">
      <a href="pages-account-settings-billing.html" class="menu-link">
        <i class="menu-icon icon-base ti tabler-receipt-2"></i>
        <div>Langganan &amp; Billing</div>
      </a>
    </li>`;

htmlFiles.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Check if it has a sidebar menu
  const menuStartIdx = html.indexOf('<ul class="menu-inner py-1">');
  const menuEndIdx = html.indexOf('</ul>\n    </aside>') !== -1 ? html.indexOf('</ul>\n    </aside>') : html.indexOf('</ul>\n</aside>');

  if (menuStartIdx !== -1 && menuEndIdx !== -1) {
    let customizedMenu = standardMenu;
    
    // Set active state
    customizedMenu = customizedMenu.replace('__INDEX_ACTIVE__', file === 'index.html' ? 'active' : '');
    customizedMenu = customizedMenu.replace('__PRODUCT_ACTIVE__', (file === 'app-ecommerce-product-list.html' || file === 'app-ecommerce-product-detail.html') ? 'active' : '');
    customizedMenu = customizedMenu.replace('__LOGISTICS_ACTIVE__', file === 'app-logistics-dashboard.html' ? 'active' : '');
    customizedMenu = customizedMenu.replace('__FLEET_ACTIVE__', file === 'app-logistics-fleet.html' ? 'active' : '');
    customizedMenu = customizedMenu.replace('__USER_ACTIVE__', (file === 'app-user-list.html' || file === 'app-user-view-account.html') ? 'active' : '');
    customizedMenu = customizedMenu.replace('__ROLES_ACTIVE__', file === 'app-access-roles.html' ? 'active' : '');
    customizedMenu = customizedMenu.replace('__PERMISSION_ACTIVE__', file === 'app-access-permission.html' ? 'active' : '');
    customizedMenu = customizedMenu.replace('__SETTINGS_ACTIVE__', file.startsWith('pages-account-settings') && !file.includes('billing') ? 'active' : '');
    customizedMenu = customizedMenu.replace('__BILLING_ACTIVE__', file.includes('billing') ? 'active' : '');

    const newHtml = html.substring(0, menuStartIdx + '<ul class="menu-inner py-1">\n'.length) +
                    customizedMenu + '\n  ' +
                    html.substring(menuEndIdx);
    
    // Also clean up any lingering references in quick links dropdown
    let cleanedHtml = newHtml.replace(/app-ecommerce-category-list\.html/g, 'app-ecommerce-product-list.html');
    cleanedHtml = cleanedHtml.replace(/app-ecommerce-customer-all\.html/g, 'app-ecommerce-product-list.html');
    cleanedHtml = cleanedHtml.replace(/app-ecommerce-manage-reviews\.html/g, 'app-ecommerce-product-detail.html');
    cleanedHtml = cleanedHtml.replace(/app-ecommerce-dashboard\.html/g, 'index.html');
    cleanedHtml = cleanedHtml.replace(/app-ecommerce-customer-details-overview\.html/g, 'app-ecommerce-product-detail.html');

    fs.writeFileSync(filePath, cleanedHtml, 'utf8');
    console.log('Synchronized sidebar & links in:', file);
  }
});

console.log('All remaining dashboard HTML pages synchronized successfully!');
