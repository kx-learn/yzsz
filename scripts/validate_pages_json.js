const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'pages.json');
try{
  let s = fs.readFileSync(p, 'utf8');
  // strip BOM
  if(s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  JSON.parse(s);
  console.log('pages.json parse OK');
  process.exit(0);
}catch(e){
  console.error('pages.json parse ERROR:', e && e.message);
  process.exit(1);
}
