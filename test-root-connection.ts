import mysql from 'mysql2/promise';

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: 'root',
    password: 'rootpassword',
    database: process.env.DB_NAME || 'student_attendance',
    timezone: '+08:00',
    charset: 'utf8mb4_unicode_ci',
    connectTimeout: 10000, // 10 seconds timeout
  };

  console.log('Testing database connection with root user:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to database with root user!');
    
    // Test query
    const [results] = await connection.query('SELECT 1 as connected');
    console.log('✅ Test query successful:', results);
    
    // Show tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Available tables:', tables);
    
    // Check users
    const [users] = await connection.query('SELECT User, Host FROM mysql.user');
    console.log('👥 Database users:', users);
    
    await connection.end();
    console.log('✅ Connection test completed successfully');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('Error syscall:', error.syscall);
  }
}

testConnection();