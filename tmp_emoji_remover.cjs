const fs = require('fs');
const path = require('path');

function removeEmojisFromFile(fp) {
    if (fp.includes('BirthdayPopup') || fp.includes('Sidebar')) return; // handled sidebar separately
    let content = fs.readFileSync(fp, 'utf8');
    
    content = content.replace(/[\u{1F300}-\u{1F9A0}]/gu, ""); // Block of emojis
    content = content.replace(/[\u{1F600}-\u{1F64F}]/gu, ""); // Emoticons
    content = content.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ""); // Symbols
    content = content.replace(/[\u{1F900}-\u{1F9FF}]/gu, ""); // Supplemental
    content = content.replace(/[\u{2600}-\u{26FF}]/gu, ""); // Misc symbols
    content = content.replace(/[\u{2700}-\u{27BF}]/gu, ""); // Dingbats
    content = content.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, ""); // Flags
    content = content.replace(/\uFE0F/g, ""); // Variation selectors
    content = content.replace(/✅/g, "");
    content = content.replace(/⚠️/g, "");
    content = content.replace(/👑/g, "");
    content = content.replace(/👥/g, "");
    content = content.replace(/📋/g, "");
    content = content.replace(/👤/g, "");
    content = content.replace(/✍/g, "");
    content = content.replace(/⚙/g, "");
    content = content.replace(/💬/g, "");
    content = content.replace(/🔴/g, "");
    content = content.replace(/💡/g, "");
    content = content.replace(/⌚/g, "");
    content = content.replace(/✨/g, "");
    content = content.replace(/⏱/g, "");
    content = content.replace(/ℹ/g, "");
    
    // Make sure we didn't wipe out common symbols we actually like
    // like standard punctuation.
    
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
