const fs = require('fs');
const path = require('path');

// Regex for mostly emojis (including some symbols like ✕ ✅ ⚙)
const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

// Safe characters to retain (digits, letters, standard punctuation)
// But the simplest is just replacing the match with an empty string.

function removeEmojisFromFile(fp) {
    if (fp.includes('BirthdayPopup')) return;
    let content = fs.readFileSync(fp, 'utf8');
    
    // Some specific replacements to make it professional
    content = content.replace(/✅/g, '');
    content = content.replace(/⚠️/g, '');
    content = content.replace(/🛡️/g, '');
    content = content.replace(/👑/g, '');
    content = content.replace(/📊/g, '');
    content = content.replace(/👥/g, '');
    content = content.replace(/📅/g, '');
    content = content.replace(/📋/g, '');
    content = content.replace(/✍️/g, '');
    content = content.replace(/👤/g, '');
    content = content.replace(/⚙️/g, '');
    content = content.replace(/🏢/g, '');
    content = content.replace(/🚀/g, '');
    content = content.replace(/💬/g, '');
    content = content.replace(/🔴/g, '');
    content = content.replace(/➕/g, '');
    content = content.replace(/🎊/g, '');
    content = content.replace(/🎂/g, '');
    content = content.replace(/💡/g, '');
    content = content.replace(/📈/g, '');
    content = content.replace(/⏳/g, '');
    content = content.replace(/✓/g, '');
    content = content.replace(/✕/g, '');
    content = content.replace(/💵/g, '');
    content = content.replace(/🎓/g, '');
    content = content.replace(/🌐/g, '');
    content = content.replace(/👔/g, '');
    content = content.replace(/📅/g, '');
    content = content.replace(/⏱/g, '');
    content = content.replace(/ℹ️/g, '');
    content = content.replace(/🔒/g, '');
    content = content.replace(/🚪/g, '');
    content = content.replace(/❌/g, '');
    content = content.replace(/🔄/g, '');
    content = content.replace(/📝/g, '');
    content = content.replace(/📆/g, '');

    // Catch any remaining with regex, but only safely
    // Actually, explicit replace is safer so we don't accidentally remove useful non-ascii like quotes
    fs.writeFileSync(fp, content, 'utf8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            removeEmojisFromFile(fullPath);
        }
    }
}

walkDir('./src/pages');
walkDir('./src/components');
console.log("Done");
