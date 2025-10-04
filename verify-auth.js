import bcrypt from 'bcrypt';

// Test the actual password hash from the database
const storedHash = '\\.7gb0K3OOZrKwl6gozLmeyY56bFwRyQqd2vtS8FS';
const password = 'password123';

console.log('Testing password verification...');
console.log('Stored hash:', storedHash);
console.log('Password to test:', password);

bcrypt.compare(password, storedHash)
  .then(result => {
    console.log('Password match result:', result);
    if (result) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
  })
  .catch(error => {
    console.error('Error during password verification:', error);
  });