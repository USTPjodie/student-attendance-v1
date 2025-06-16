import { db } from './db';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  try {
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

    // Clear existing data
    await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    await db.execute('TRUNCATE TABLE users;');
    await db.execute('TRUNCATE TABLE students;');
    await db.execute('TRUNCATE TABLE classes;');
    await db.execute('TRUNCATE TABLE class_enrollments;');
    await db.execute('TRUNCATE TABLE attendance_records;');
    await db.execute('TRUNCATE TABLE consultations;');
    await db.execute('TRUNCATE TABLE assignments;');
    await db.execute('TRUNCATE TABLE grades;');
    await db.execute('SET FOREIGN_KEY_CHECKS = 1;');

    for (const command of commands) {
      await db.execute(command);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase(); 