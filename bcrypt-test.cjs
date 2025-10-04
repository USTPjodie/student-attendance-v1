const bcrypt = require('bcrypt');

// Test the exact password and hash we're using
const password = 'password123';
const hash = '$2b$10$kLocg06SI437x.7gb0K3OOZrKwl6gozLmeyY56bFwRyQqd2vtS8FS';

console.log('Testing bcrypt comparison...');
console.log('Password:', password);
console.log('Hash:', hash);

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Comparison result:', result);
  }
});