const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const targetStr = `      if (validEmployees.length !== mdoc.employees.length) {
        mdoc.employees = validEmployees;
        if (!mdoc.managerName && managerUser) mdoc.managerName = managerUser.name;
        await mdoc.save();
      }`;

const replacementStr = `      if (validEmployees.length !== mdoc.employees.length) {
        mdoc.employees = validEmployees;
        // Aggressive fallback for managerName
        mdoc.managerName = managerUser.name || mdoc.managerName || 'Unknown Manager';
        await mdoc.save();
      }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.js', content, 'utf8');
} else {
  // If my previous script failed to match, I'll match the original string again
  const targetOriginal = `      if (validEmployees.length !== mdoc.employees.length) {
        mdoc.employees = validEmployees;
        await mdoc.save();
      }`;
  if (content.includes(targetOriginal)) {
    content = content.replace(targetOriginal, replacementStr);
    fs.writeFileSync('server.js', content, 'utf8');
  }
}
