import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/schema';

// Database connection configuration
const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Empty password since we connected successfully with no password
  database: 'student_attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Export raw connection for direct queries
export { connection };

// Test database connection
try {
  await connection.connect();
  console.log('Successfully connected to MariaDB database on port 3306');
  
  // Test query to verify table exists
  const [tables] = await connection.query('SHOW TABLES');
  console.log('Available tables:', tables);
  
  // Test teacher_availability table
  const [columns] = await connection.query('DESCRIBE teacher_availability');
  console.log('Teacher availability table structure:', columns);

  // Test John Smith's availability
  const [johnAvailability] = await connection.query(
    'SELECT * FROM teacher_availability WHERE teacher_id = 1'
  );
  console.log('John Smith\'s availability:', johnAvailability);
} catch (error) {
  console.error('Error connecting to MariaDB:', error);
  process.exit(1);
}
