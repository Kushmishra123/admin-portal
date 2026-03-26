const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/employees/QBL-E0024',
  method: 'DELETE',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
