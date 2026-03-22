const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/kushm/Downloads/admin-portal-main (2)/admin-portal-main/src';
const filesToProcess = ['components/LoginForm.jsx', 'components/SignupForm.jsx', 'pages/AddEmployee.jsx', 'pages/Settings.jsx', 'pages/Policy.jsx', 'pages/MyLeaves.jsx', 'pages/ManageLeaves.jsx'];

filesToProcess.forEach(rel => {
  const file = path.join(srcDir, rel);
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Find all <form ... onSubmit={...} ...>
  // and extract the handler
  let modified = false;
  
  content = content.replace(/<form([^>]*)onSubmit=\{([^}]+)\}([^>]*)>/g, (match, prefix, handler, suffix) => {
    modified = true;
    return `<form${prefix}${suffix} data-submit-handler="${handler}">`;
  });
  
  if (modified) {
    let parts = content.split(/(<form[^>]*>|<\/form>|<LoaderButton[^>]*>)/);
    let currentHandler = null;
    let newParts = [];
    
    for (let part of parts) {
      if (part.startsWith('<form')) {
        let m = part.match(/data-submit-handler="([^"]+)"/);
        if (m) {
          currentHandler = m[1];
          part = part.replace(/ data-submit-handler="[^"]+"/, '');
        }
      } else if (part.startsWith('</form>')) {
        currentHandler = null;
      } else if (part.startsWith('<LoaderButton') && part.includes('type="submit"') && currentHandler) {
        if (!part.includes('onClick=')) {
           part = part.replace('<LoaderButton', `<LoaderButton onClick={${currentHandler}}`);
        }
      }
      newParts.push(part);
    }
    
    fs.writeFileSync(file, newParts.join(''), 'utf8');
    console.log('Updated form submits in', file);
  }
});
