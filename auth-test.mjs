// Simple test to check authentication logic
import { storage } from './server/storage.js';

async function testAuth() {
  try {
    console.log('Testing authentication logic...');
    
    // Test getting user by email
    const user = await storage.getUserByEmail('prof.smith@ustp.edu.ph');
    console.log('User from storage:', user);
    
    if (!user) {
      console.log('User not found in storage');
      return;
    }
    
    // Test password comparison
    const bcrypt = await import('bcrypt');
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', isMatch);
  } catch (error) {
    console.error('Error in auth test:', error);
  }
}

testAuth();