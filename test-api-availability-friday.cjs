const http = require('http');

// Test the availability API endpoint for Friday
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/availability/1/slots?date=2025-10-03T00:00:00.000Z',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Body: ${data}`);
    try {
      const slots = JSON.parse(data);
      console.log(`Available slots for Friday 2025-10-03: ${slots.length}`);
      slots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.startTime} - ${slot.endTime}`);
      });
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.end();