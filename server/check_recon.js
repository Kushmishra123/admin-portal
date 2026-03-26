const fs = require('fs');
const txt = fs.readFileSync('server.js', 'utf8');
const lines = txt.split(/\r?\n/);
let inRecon = false;
let output = [];
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('async function reconcileManagerData()')) inRecon = true;
  if (inRecon) output.push(lines[i]);
  if (inRecon && lines[i] === '}') break;
}
fs.writeFileSync('recon_check.txt', output.join('\n'));
