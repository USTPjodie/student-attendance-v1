import { connection } from './db';

async function updateSchema() {
  try {
    // Drop the old table if it exists
    await connection.query('DROP TABLE IF EXISTS teacher_availability_blocks');
    
    // Create the new table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teacher_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        day VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `);
    
    console.log('Schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema(); 