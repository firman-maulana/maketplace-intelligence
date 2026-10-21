const fs = require('fs');
const jsFile = 'd:/Next/marketplace-intelligence/dashboard/assets/js/app-ecommerce-product-list.js';

let js = fs.readFileSync(jsFile, 'utf8');

const targetStr = 'ajax:assetsPath+"json/ecommerce-product-list.json"';
const replaceStr = 'ajax:{url:"http://localhost:8080/api/products",dataSrc:function(json){return json.data||[];},error:function(){return assetsPath+"json/ecommerce-product-list.json";}}';

if (js.includes(targetStr)) {
  js = js.replace(targetStr, replaceStr);
  fs.writeFileSync(jsFile, js, 'utf8');
  console.log('Successfully connected DataTables to http://localhost:8080/api/products!');
} else {
  console.log('Target string already updated or not found.');
}
