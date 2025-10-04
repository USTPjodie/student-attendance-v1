import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

// Database connection configuration
const connectionConfig = {
  host: 'localhost',
  port: 3306,
  user: 'appuser',
  password: 'apppassword',
  database: 'student_attendance',
};

async function testAuthFix() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to database successfully');

    // Check if users exist
    const [users] = await connection.query('SELECT * FROM users WHERE email IN (?, ?)', [
      'prof.smith@ustp.edu.ph',
      'alice.doe@student.ustp.edu.ph'
    ]);
    
    console.log('Found users:', users);
    
    if (users.length === 0) {
      console.log('No users found. You need to run the seed script.');
      return;
    }
    
    // Test password for one user
    const user = users[0];
    console.log('Testing user:', user.email);
    console.log('Stored password hash:', user.password);
    
    // Try to verify password
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match result:', isMatch);
    
    if (isMatch) {
      console.log('✅ Authentication should work correctly!');
    } else {
      console.log('❌ Password verification failed. The hash might be incorrect.');
    }
    
  } catch (error) {
    console.error('Error testing auth fix:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAuthFix();