// Test by directly calling the storage methods
const { storage } = require('./dist/storage');

async function testAppAuth() {
  try {
    console.log('Testing authentication through app storage...');
    
    // Test getting user by email
    const user = await storage.getUserByEmail('prof.smith@ustp.edu.ph');
    console.log('User from storage:', user);
    
    if (!user) {
      console.log('User not found in storage');
      return;
    }
    
    // Test password comparison
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', passwordMatch);
    
    if (passwordMatch) {
      console.log('Authentication would be successful!');
    } else {
      console.log('Authentication would fail!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAppAuth();