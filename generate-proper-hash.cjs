const bcrypt = require('bcrypt');

async function generateProperHash() {
  try {
    // Generate a proper bcrypt hash for 'password123'
    const saltRounds = 10;
    const plainPassword = 'password123';
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log('Generated hash:', hash);
    
    // Test the hash
    const isMatch = await bcrypt.compare(plainPassword, hash);
    console.log('Hash verification:', isMatch);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateProperHash();