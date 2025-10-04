const bcrypt = require('bcrypt');

// Simulate the authentication logic
async function testAuth() {
  // These are the credentials we're testing
  const email = 'prof.smith@ustp.edu.ph';
  const password = 'password123';
  
  // This is what we expect to get from the database
  const dbUser = {
    id: 3,
    email: 'prof.smith@ustp.edu.ph',
    password: '$2b$10$vMl7x.Q.wI7xJ.UU././hOaFaH6RHaVdX9D3N6I49kP6Dz4b/Hq0G',
    first_name: 'Professor',
    last_name: 'Smith',
    role: 'teacher'
  };
  
  console.log('Testing authentication for:', email);
  console.log('Database user:', dbUser);
  
  // Check if email matches
  if (dbUser.email !== email) {
    console.log('Email does not match');
    return;
  }
  
  // Check password
  const passwordMatch = await bcrypt.compare(password, dbUser.password);
  console.log('Password match:', passwordMatch);
  
  if (passwordMatch) {
    console.log('Authentication successful!');
  } else {
    console.log('Authentication failed!');
  }
}

testAuth();