const bcrypt = require('bcrypt');

// Test the password hash from the database
const hashedPassword = '$2b$10$vMl7x.Q.wI7xJ.UU././hOaFaH6RHaVdX9D3N6I49kP6Dz4b/Hq0G';
const plainPassword = 'password123';

async function testBcrypt() {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Password match:', isMatch);
  } catch (error) {
    console.error('Error:', error);
  }
}

testBcrypt();