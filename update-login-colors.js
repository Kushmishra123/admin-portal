import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.join(__dirname, 'src', 'styles', 'login.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/#080c08/gi, '#050505');           // Main bg
css = css.replace(/#0e1510/gi, '#111111');           // Cards
css = css.replace(/#1a2a1a/gi, '#222222');           // Borders
css = css.replace(/rgba\(118,\s*199,\s*51/gi, 'rgba(92, 184, 92'); // rgba green
css = css.replace(/#76c733/gi, '#5cb85c');           // Main green
css = css.replace(/#8fd63e/gi, '#6dd66d');           // Hover green
css = css.replace(/#6b7b6b/gi, '#999999');           // Muted text
css = css.replace(/#4a5a4a/gi, '#666666');           // Darker text
css = css.replace(/#5a6b5a/gi, '#888888');
css = css.replace(/#d0e0d0/gi, '#dddddd');           // Light text
css = css.replace(/#e0f0e0/gi, '#ffffff');           // High contrast text
css = css.replace(/#0e150e/gi, '#1a1a1a');           // alternate border
css = css.replace(/linear-gradient\(160deg, #0a150a 0%, #0c1a0c 60%, #080c08 100%\)/g, 'linear-gradient(160deg, #111 0%, #1a1a1a 60%, #050505 100%)');
css = css.replace(/#6b8b6b/gi, '#789878');           // specific login hint color

fs.writeFileSync(cssPath, css);
console.log('Login CSS updated successfully!');
