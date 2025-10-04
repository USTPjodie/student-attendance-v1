const http = require('http');

// Test the teacher availability API endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/availability/1',
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
      const availability = JSON.parse(data);
      console.log(`Teacher availability: ${availability.length} slots`);
      availability.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.day}: ${slot.startTime} - ${slot.endTime}`);
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