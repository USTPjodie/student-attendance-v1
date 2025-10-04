import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/schema';

// Database connection configuration for Vercel
// Uses environment variables that should be set in Vercel dashboard
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

console.log('Vercel database config:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  user: connectionConfig.user,
  database: connectionConfig.database
});

// For Vercel serverless, we create connections on demand rather than maintaining a persistent connection
export async function getDbConnection() {
  try {
    const connection = await mysql.createConnection(connectionConfig);
    return connection;
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}

// Create drizzle instance on demand
export async function getDrizzleDb() {
  const connection = await getDbConnection();
  return drizzle(connection, { schema, mode: 'default' });
}