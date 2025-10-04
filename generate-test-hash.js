import bcrypt from 'bcrypt';

const password = 'password123';

console.log('Generating new hash for password:', password);

bcrypt.hash(password, 10)
  .then(hash => {
    console.log('Generated hash:', hash);
    
    // Test the hash
    return bcrypt.compare(password, hash)
      .then(result => {
        console.log('Verification result:', result);
        if (result) {
          console.log('✅ Hash verification successful!');
        } else {
          console.log('❌ Hash verification failed!');
        }
      });
  })
  .catch(error => {
    console.error('Error generating hash:', error);
  });