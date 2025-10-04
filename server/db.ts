import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/schema';

// Database connection configuration
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'student_attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00', // Use Philippine time for consistency
  charset: 'utf8mb4_unicode_ci',
  connectTimeout: 30000, // 30 seconds timeout
};

console.log('Attempting to connect to database with config:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  user: connectionConfig.user,
  database: connectionConfig.database
});

// Create a connection pool instead of a single connection
const pool = mysql.createPool(connectionConfig);

// Create drizzle instance using the pool
export const db = drizzle(pool, { schema, mode: 'default' });

// Export pool for direct queries
export { pool };

// Function to get a connection from the pool with error handling
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Failed to get database connection from pool:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  let connection;
  try {
    console.log('Testing database connection...');
    connection = await getConnection();
    console.log('Successfully connected to MySQL database on port ' + (process.env.DB_PORT || '3306'));
    
    // Test query to verify table exists
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Available tables:', tables);
    
    // Test query to verify teacher availability table structure
    const [availabilityStructure] = await connection.query('DESCRIBE teacher_availability');
    console.log('Teacher availability table structure:', availabilityStructure);
    
    // Test query to see sample data
    const [sampleData] = await connection.query('SELECT * FROM teacher_availability WHERE teacher_id = 1 LIMIT 1');
    // Type assertion to handle mysql2's QueryResult type
    if (Array.isArray(sampleData) && sampleData.length > 0) {
      console.log("John Smith's availability sample:", sampleData[0]);
    }
    
    connection.release();
  } catch (error) {
    console.error('Database connection error:', error);
    if (connection) {
      connection.release();
    }
  }
}

// Run test connection
testConnection();