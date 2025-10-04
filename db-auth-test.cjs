const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testDbAuth() {
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'rootpassword',
      database: 'student_attendance'
    });
    
    console.log('Connected to database');
    
    // Get user by email
    const [rows] = await connection.execute(
      'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
      ['prof.smith@ustp.edu.ph']
    );
    
    if (rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = rows[0];
    console.log('User from database:', user);
    
    // Test password
    const passwordMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', passwordMatch);
    
    if (passwordMatch) {
      console.log('Authentication would be successful!');
    } else {
      console.log('Authentication would fail!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDbAuth();