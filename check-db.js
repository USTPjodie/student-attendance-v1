import mysql from 'mysql2/promise';

// Database connection configuration - using 'db' as hostname since we're in the Docker network
const connectionConfig = {
  host: 'db',  // Changed from 'localhost' to 'db' for Docker networking
  port: 3306,
  user: 'appuser',
  password: 'apppassword',
  database: 'student_attendance',
};

async function checkDatabase() {
  let connection;
  try {
    console.log('🔍 Checking database connection...');
    
    // Create connection
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database successfully');
    
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
    
    const [attendanceCount] = await connection.query('SELECT COUNT(*) as count FROM attendance_records');
    console.log(`Attendance Records: ${attendanceCount[0].count}`);
    
    const [teacherCount] = await connection.query('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
    console.log(`Teachers: ${teacherCount[0].count}`);
    
    // Show sample data
    console.log('\n👥 Sample Users:');
    const [users] = await connection.query('SELECT id, email, first_name, last_name, role FROM users LIMIT 5');
    users.forEach(user => {
      console.log(`  ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n📚 Sample Classes:');
    const [classes] = await connection.query('SELECT id, name, code FROM classes LIMIT 5');
    classes.forEach(cls => {
      console.log(`  ${cls.name} (${cls.code})`);
    });
    
    console.log('\n📝 Sample Enrollments:');
    const [enrollments] = await connection.query(`
      SELECT c.name as class_name, u.first_name, u.last_name 
      FROM class_enrollments ce 
      JOIN classes c ON ce.class_id = c.id 
      JOIN students s ON ce.student_id = s.id 
      JOIN users u ON s.user_id = u.id 
      LIMIT 5
    `);
    enrollments.forEach(enrollment => {
      console.log(`  ${enrollment.first_name} ${enrollment.last_name} enrolled in ${enrollment.class_name}`);
    });
    
    console.log('\n✅ Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Make sure the Docker containers are running with: docker-compose up');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Tip: Check your database credentials in the docker-compose.yml file');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase();