import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_attendance',
    });

    console.log('Connected to database successfully');

    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    // @ts-ignore
    const tableCount = tables.length;
    
    if (tableCount === 0) {
      console.log('No tables found. Creating schema...');
      
      // Read the schema SQL file
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      
      // Split and execute schema commands
      const commands = schemaSql
        .split(';')
        .filter(cmd => cmd.trim())
        .map(cmd => cmd + ';');

      for (const command of commands) {
        if (command.trim()) {
          await connection.execute(command);
        }
      }
      
      console.log('Schema created successfully');
    } else {
      console.log(`Found ${tableCount} tables in database`);
    }

    // Check if data exists
    const [userCountResult] = await connection.query('SELECT COUNT(*) as count FROM users');
    // @ts-ignore
    const userCount = userCountResult[0].count;
    
    if (userCount === 0) {
      console.log('No data found. Seeding database...');
      
      // Read the seed data SQL file
      const seedData = fs.readFileSync(path.join(__dirname, 'seed-data.sql'), 'utf8');

      // Hash passwords for all users
      const password = await bcrypt.hash('password123', 10);
      
      // Replace the placeholder password with the hashed one
      const seedDataWithHashedPasswords = seedData.replace(
        /\$2b\$10\$your_hashed_password/g,
        password
      );

      // Execute the SQL commands
      const commands = seedDataWithHashedPasswords
        .split(';')
        .filter(cmd => cmd.trim())
        .map(cmd => cmd + ';');

      for (const command of commands) {
        if (command.trim()) {
          await connection.execute(command);
        }
      }
      
      console.log('Database seeded successfully!');
    } else {
      console.log(`Found ${userCount} users in database. Skipping seed.`);
    }
    
    await connection.end();
    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
}

initDatabase();