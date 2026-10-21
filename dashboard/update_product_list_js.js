const fs = require('fs');
const jsPath = 'd:/Next/marketplace-intelligence/dashboard/assets/js/app-ecommerce-product-list.js';

let content = fs.readFileSync(jsPath, 'utf8');

// Replace product name render in table
const targetStr = '<h6 class="text-nowrap mb-0">${o}</h6>';
const replacementStr = '<h6 class="text-nowrap mb-0"><a href="app-ecommerce-product-detail.html?id=' + '${n.id}&name=' + '${encodeURIComponent(o)}&brand=' + '${encodeURIComponent(s)}&price=' + '${n.price}&sku=' + '${n.sku}&qty=' + '${n.qty}&image=' + '${r||\'\'}" class="text-heading text-primary-hover fw-medium text-truncate">${o}</a></h6>';

content = content.replace(targetStr, replacementStr);
content = content.replace('<a href="javascript:void(0);" class="dropdown-item">Detail</a>', '<a href="app-ecommerce-product-detail.html?id=' + '${n.id}&name=' + '${encodeURIComponent(o)}&brand=' + '${encodeURIComponent(s)}&price=' + '${n.price}&sku=' + '${n.sku}&qty=' + '${n.qty}&image=' + '${r||\'\'}" class="dropdown-item">Detail Lengkap Produk</a>');

fs.writeFileSync(jsPath, content, 'utf8');
console.log('Successfully updated app-ecommerce-product-list.js with clickable links!');
