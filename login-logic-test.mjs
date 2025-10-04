// Test the exact login logic from the routes file
import { storage } from './server/storage.js';
import bcrypt from 'bcrypt';

async function testLoginLogic() {
  try {
    console.log('Testing login logic...');
    
    const email = 'prof.smith@ustp.edu.ph';
    const password = 'password123';
    
    // Get user by email - the role is stored in the database
    const user = await storage.getUserByEmail(email);
    console.log('User from storage:', user);
    
    if (!user) {
      console.log('User not found');
      return;
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('Password does not match');
      return;
    }
    
    console.log('Login would be successful!');
    
  } catch (error) {
    console.error('Error in login logic test:', error);
  }
}

testLoginLogic();