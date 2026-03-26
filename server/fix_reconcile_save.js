const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const targetStr = `      if (validEmployees.length !== mdoc.employees.length) {
        mdoc.employees = validEmployees;
        await mdoc.save();
      }`;

const replacementStr = `      if (validEmployees.length !== mdoc.employees.length) {
        mdoc.employees = validEmployees;
        if (!mdoc.managerName && managerUser) mdoc.managerName = managerUser.name;
        await mdoc.save();
      }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.js', content, 'utf8');
  console.log('Fixed save validation in reconcileManagerData');
} else {
  console.log('Target string not found!');
  // Try another similar match
  const altTargetStr = `      if (validEmployees.length !== mdoc.employees.length) {\r
        mdoc.employees = validEmployees;\r
        await mdoc.save();\r
      }`;
  if (content.includes(altTargetStr)) {
    content = content.replace(altTargetStr, replacementStr);
    fs.writeFileSync('server.js', content, 'utf8');
    console.log('Fixed save validation with CR match');
  }
}
