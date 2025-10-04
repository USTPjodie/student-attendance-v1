// Test database connection and user retrieval from within the app
import { connection } from './server/db.js';

async function testAppDb() {
  try {
    console.log('Testing app database connection...');
    
    // Test a simple query
    const [testRows] = await connection.execute('SELECT 1 as test');
    console.log('Connection test result:', testRows);
    
    // Test getting a user by email
    const [userRows] = await connection.execute(
      'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
      ['prof.smith@ustp.edu.ph']
    );
    
    console.log('User query result:', userRows);
    
    if (userRows.length > 0) {
      const user = userRows[0];
      console.log('User found:', user);
      
      // Test password comparison
      const bcrypt = await import('bcrypt');
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('Password match:', isMatch);
    } else {
      console.log('User not found in app database');
    }
  } catch (error) {
    console.error('Error in app database test:', error);
  }
}

testAppDb();