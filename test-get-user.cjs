const { storage } = require('./server/storage');

async function testGetUser() {
  try {
    const user = await storage.getUserByEmail('prof.smith@ustp.edu.ph');
    console.log('User:', user);
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetUser();