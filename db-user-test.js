// Simple test to check if we can retrieve a user directly from the database
const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'db', // Use the service name from docker-compose
  port: 3306,
  user: 'appuser',
  password: 'apppassword',
  database: 'student_attendance'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
  
  // Test getting a user by email
  connection.execute(
    'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
    ['prof.smith@ustp.edu.ph'],
    (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        connection.end();
        return;
      }
      
      console.log('User query result:', results);
      
      if (results.length > 0) {
        const user = results[0];
        console.log('User found:', user);
        
        // Test password comparison
        const bcrypt = require('bcrypt');
        bcrypt.compare('password123', user.password, (err, isMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
          } else {
            console.log('Password match:', isMatch);
          }
          connection.end();
        });
      } else {
        console.log('User not found');
        connection.end();
      }
    }
  );
});