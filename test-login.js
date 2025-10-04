// Test login functionality
async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test teacher login
    const teacherResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'prof.smith@ustp.edu.ph',
        password: 'password123'
      })
    });
    
    console.log('Teacher login response status:', teacherResponse.status);
    const teacherData = await teacherResponse.json();
    console.log('Teacher login response:', teacherData);
    
    // Test student login
    const studentResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alice.doe@student.ustp.edu.ph',
        password: 'password123'
      })
    });
    
    console.log('Student login response status:', studentResponse.status);
    const studentData = await studentResponse.json();
    console.log('Student login response:', studentData);
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();