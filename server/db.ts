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

// Function to create connection with retry logic
async function createConnectionWithRetry(config: any, maxRetries = 5, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempting to connect to database (attempt ${i + 1}/${maxRetries})...`);
      const connection = await mysql.createConnection(config);
      console.log('Successfully connected to database!');
      return connection;
    } catch (error: any) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
}

// Create connection with retry logic
const connection = await createConnectionWithRetry(connectionConfig);

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
  
  // Test query to verify teacher availability table structure
  const [availabilityStructure] = await connection.query('DESCRIBE teacher_availability');
  console.log('Teacher availability table structure:', availabilityStructure);
  
  // Test query to see sample data
  const [sampleData] = await connection.query('SELECT * FROM teacher_availability WHERE teacher_id = 1 LIMIT 1');
  // Type assertion to handle mysql2's QueryResult type
  if (Array.isArray(sampleData) && sampleData.length > 0) {
    console.log("John Smith's availability sample:", sampleData[0]);
  }
} catch (error) {
  console.error('Database connection error:', error);
}