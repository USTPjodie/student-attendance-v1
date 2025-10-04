const http = require('http');
const { format } = require('date-fns');

// Function to determine if a date has teacher availability
async function isDateAvailable(teacherId, dateToCheck) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/availability/${teacherId}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const availability = JSON.parse(data);
          const dayName = format(dateToCheck, 'EEEE');
          const isAvailable = availability.some(slot => slot.day === dayName);
          resolve(isAvailable);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test the calendar enhancement
async function testCalendarEnhancement() {
  console.log('🔍 Testing calendar enhancement...');
  
  const teacherId = 1; // John Smith
  const testDates = [
    new Date('2025-09-29'), // Monday
    new Date('2025-09-30'), // Tuesday
    new Date('2025-10-01'), // Wednesday
    new Date('2025-10-02'), // Thursday
    new Date('2025-10-03'), // Friday
    new Date('2025-10-04'), // Saturday
    new Date('2025-10-05'), // Sunday
  ];

  console.log('Teacher availability:');
  for (const date of testDates) {
    const dayName = format(date, 'EEEE');
    const available = await isDateAvailable(teacherId, date);
    const status = available ? '✅ Available' : '❌ Not available';
    console.log(`  ${dayName} (${date.toISOString().split('T')[0]}): ${status}`);
  }
  
  console.log('\n✅ Calendar enhancement test completed');
}

testCalendarEnhancement().catch(console.error);