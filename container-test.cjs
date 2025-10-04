// This script will be copied to the container to test the database connection
const { connection } = require('./server/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Connection test result:', rows);
    
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
      const bcrypt = require('bcrypt');
      const passwordMatch = await bcrypt.compare('password123', user.password);
      console.log('Password match:', passwordMatch);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();