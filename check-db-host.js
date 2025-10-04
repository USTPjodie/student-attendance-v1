// This script is meant to be run from the host machine (not inside Docker)
// It checks the database connection through the exposed port

import mysql from 'mysql2/promise';

// Database connection configuration for host machine access
const connectionConfig = {
  host: 'localhost',
  port: 3306,
  user: 'appuser',
  password: 'apppassword',
  database: 'student_attendance',
};

async function checkDatabaseFromHost() {
  let connection;
  try {
    console.log('🔍 Checking database connection from host machine...');
    
    // Create connection
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database successfully from host machine');
    
    // Get database statistics
    console.log('\n📊 Database Statistics:');
    
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`Users: ${userCount[0].count}`);
    
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    console.log(`Students: ${studentCount[0].count}`);
    
    const [classCount] = await connection.query('SELECT COUNT(*) as count FROM classes');
    console.log(`Classes: ${classCount[0].count}`);
    
    const [enrollmentCount] = await connection.query('SELECT COUNT(*) as count FROM class_enrollments');
    console.log(`Class Enrollments: ${enrollmentCount[0].count}`);
    
    console.log('\n✅ Database check from host completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking database from host:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Make sure the Docker containers are running with: docker-compose up');
      console.error('💡 Tip: Check that port 3306 is properly exposed in docker-compose.yml');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Tip: Check your database credentials in the docker-compose.yml file');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseFromHost();