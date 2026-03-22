const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/kushm/Downloads/admin-portal-main (2)/admin-portal-main/src';

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(srcDir, function(err, results) {
  if (err) throw err;
  const jsxFiles = results.filter(f => f.endsWith('.jsx'));
  jsxFiles.forEach(file => {
    if (file.includes('LoaderButton.jsx')) return;
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('<button') || content.includes('</button>')) {
      // replace tags
      content = content.replace(/<button/g, '<LoaderButton');
      content = content.replace(/<\/button>/g, '</LoaderButton>');
      
      // Determine import path relative to the file
      const relativePath = path.relative(path.dirname(file), path.join(srcDir, 'components', 'LoaderButton'));
      let importPath = relativePath.replace(/\\/g, '/');
      if (!importPath.startsWith('.')) {
         importPath = './' + importPath;
      }
      
      // Check if import already exists
      if (!content.includes('LoaderButton')) {
        // Find the last import
        const importRegex = /^import .+?;?\r?\n/gm;
        let lastImportIndex = 0;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          lastImportIndex = match.index + match[0].length;
        }
        
        const loaderImport = `import LoaderButton from '${importPath}';\n`;
        content = content.slice(0, lastImportIndex) + loaderImport + content.slice(lastImportIndex);
      }
      
      fs.writeFileSync(file, content, 'utf8');
      console.log('Modified', file);
    }
  });
});
