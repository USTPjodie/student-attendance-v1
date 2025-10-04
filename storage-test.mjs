// Test the storage object directly
import { storage } from './server/storage.js';

async function testStorage() {
  try {
    console.log('Testing storage...');
    
    // Test getting user by email
    const user = await storage.getUserByEmail('prof.smith@ustp.edu.ph');
    console.log('User from storage:', user);
    
    if (!user) {
      console.log('User not found in storage');
      return;
    }
    
    console.log('User found:', user);
    
    // Test password comparison
    const bcrypt = await import('bcrypt');
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', isMatch);
  } catch (error) {
    console.error('Error in storage test:', error);
  }
}

testStorage();