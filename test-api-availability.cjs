const http = require('http');

// Test the availability API endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/availability/1/slots?date=2025-09-29T00:00:00.000Z',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.end();