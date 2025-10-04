// Simple test to check if we can get a user by email
import { connection } from './server/db.js';

async function testUserRetrieval() {
  try {
    console.log('Testing user retrieval...');
    
    // Test getting a user by email
    const [rows] = await connection.execute(
      'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
      ['prof.smith@ustp.edu.ph']
    );
    
    console.log('Query result:', rows);
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log('User found:', user);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserRetrieval();