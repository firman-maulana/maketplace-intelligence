const fs = require('fs');
const jsPath = 'd:/Next/marketplace-intelligence/dashboard/assets/js/app-ecommerce-product-list.js';

let content = fs.readFileSync(jsPath, 'utf8');

// Fix 1: Make category mapping safe
content = content.replace(
  '{targets:3,responsivePriority:5,render:function(e,t,n,a){n=s[n.category].title;return"display"===t?`',
  '{targets:3,responsivePriority:5,render:function(e,t,n,a){let catVal=typeof n.category==="number"?(s[n.category]?s[n.category].title:"Elektronik"):n.category;return"display"===t?`'
);
content = content.replace('}[n]||""}${n}', '}[catVal]||""}${catVal}');

// Fix 2: Make stock mapping safe
content = content.replace(
  '{targets:4,orderable:!1,responsivePriority:3,render:function(e,t,n,a){n=n.stock,n=r[n].title;',
  '{targets:4,orderable:!1,responsivePriority:3,render:function(e,t,n,a){let stockTitle=r[n.stock]?r[n.stock].title:"In_Stock";'
);
content = content.replace('}[n]}', '}[stockTitle]}');
content = content.replace('<span class="d-none">${n}</span>', '<span class="d-none">In_Stock</span>');

// Fix 3: Make status mapping safe
content = content.replace(
  '{targets:-2,render:function(e,t,n,a){n=n.status;return\'<span class="badge \'+o[n].class+\'" text-capitalized>\'+o[n].title+"</span>"}}',
  '{targets:-2,render:function(e,t,n,a){let st=o[n.status]||{class:"bg-label-success",title:"Aktif"};return\'<span class="badge \'+st.class+\'" text-capitalized>\'+st.title+"</span>"}}'
);

// Fix 4: Filter dropdowns
content = content.replace('t.value=s[e].title,t.textContent=s[e].title', 'let tVal=s[e]?s[e].title:e;t.value=tVal,t.textContent=tVal');
content = content.replace('t.value=r[e].title,t.textContent=r[e].title', 'let rVal=r[e]?r[e].title:e;t.value=rVal,t.textContent=rVal');
content = content.replace('t.value=o[e].title,t.textContent=o[e].title', 'let oVal=o[e]?o[e].title:e;t.value=oVal,t.textContent=oVal');

fs.writeFileSync(jsPath, content, 'utf8');
console.log('Successfully updated product list JS column renderers!');
