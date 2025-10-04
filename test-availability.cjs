const fetch = require('node-fetch');

async function testAvailability() {
  console.log('🔍 Testing teacher availability...');
  
  // Login as teacher (John Smith)
  console.log('Logging in as John Smith...');
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john.smith@ustp.edu.ph',
      password: 'password123'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ Teacher logged in successfully');
  
  // Get cookies for session
  const cookies = loginResponse.headers.raw()['set-cookie'];
  const sessionCookie = cookies ? cookies.join('; ') : '';
  
  // Get teacher availability
  console.log('Getting teacher availability...');
  const availabilityResponse = await fetch('http://localhost:3000/api/availability', {
    headers: { 'Cookie': sessionCookie }
  });
  
  console.log(`Availability API response status: ${availabilityResponse.status}`);
  
  if (!availabilityResponse.ok) {
    console.error('❌ Failed to get availability');
    return;
  }
  
  const availabilityData = await availabilityResponse.json();
  console.log(`✅ Retrieved ${availabilityData.length} availability slots`);
  
  // Display availability details
  availabilityData.forEach((slot, index) => {
    console.log(`  ${index + 1}. ${slot.day}: ${slot.startTime} - ${slot.endTime}`);
  });
  
  // Test availability for a specific date (e.g., next Monday)
  const testDate = new Date();
  // Set to next Monday
  testDate.setDate(testDate.getDate() + (1 + 7 - testDate.getDay()) % 7);
  console.log(`\nTesting availability for next Monday (${testDate.toISOString().split('T')[0]})...`);
  
  const specificAvailabilityResponse = await fetch(
    `http://localhost:3000/api/teacher-availability/1?date=${testDate.toISOString().split('T')[0]}`, 
    {
      headers: { 'Cookie': sessionCookie }
    }
  );
  
  console.log(`Specific availability API response status: ${specificAvailabilityResponse.status}`);
  
  if (!specificAvailabilityResponse.ok) {
    console.error('❌ Failed to get specific availability');
    return;
  }
  
  const specificAvailabilityData = await specificAvailabilityResponse.json();
  console.log(`✅ Retrieved ${specificAvailabilityData.length} available time slots for next Monday`);
  
  specificAvailabilityData.forEach((slot, index) => {
    console.log(`  ${index + 1}. ${slot.startTime} - ${slot.endTime}`);
  });
  
  console.log('✅ Availability test completed');
}

testAvailability().catch(console.error);