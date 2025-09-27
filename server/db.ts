import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/schema';

// Database connection configuration
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // Use UTC for consistency
  charset: 'utf8mb4_unicode_ci'
};

console.log('Attempting to connect to database with config:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  user: connectionConfig.user,
  database: connectionConfig.database
});

const connection = await mysql.createConnection(connectionConfig);

// Create drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Export raw connection for direct queries
export { connection };

// Test database connection
try {
  console.log('Successfully connected to MySQL database on port ' + (process.env.DB_PORT || '3306'));
  
  // Test query to verify table exists
  const [tables] = await connection.query('SHOW TABLES');
  console.log('Available tables:', tables);
  
  // Test teacher_availability table
  const [columns] = await connection.query('DESCRIBE teacher_availability');
  console.log('Teacher availability table structure:', columns);

  // Test John Smith's availability if exists
  const [johnAvailabilityRows] = await connection.query(
    'SELECT * FROM teacher_availability WHERE teacher_id = 1 LIMIT 1'
  );
  // @ts-ignore
  if (johnAvailabilityRows.length > 0) {
    // @ts-ignore
    console.log('John Smith\'s availability sample:', johnAvailabilityRows[0]);
  }
} catch (error) {
  console.error('Error connecting to MySQL:', error);
  process.exit(1);
}
