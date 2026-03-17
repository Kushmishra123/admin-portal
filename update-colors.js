import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.join(__dirname, 'src', 'styles', 'dashboard.css');
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
css = css.replace(/linear-gradient\(180deg, #0a110a 0%, #0c140c 100%\)/g, '#0a0a0a');
css = css.replace(/linear-gradient\(135deg, #0e1a0e 0%, #121f12 50%, #0a140a 100%\)/g, 'linear-gradient(135deg, #111 0%, #1a1a1a 50%, #0a0a0a 100%)');
css = css.replace(/linear-gradient\(135deg, #0e1a0e, #111f11\)/g, 'linear-gradient(135deg, #111, #1a1a1a)');
css = css.replace(/rgba\(8, 12, 8, 0.95\)/g, 'rgba(5, 5, 5, 0.95)'); // Navbar bg

fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully!');
