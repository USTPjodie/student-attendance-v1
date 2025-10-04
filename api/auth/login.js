import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import { getDbConnection } from '../../server/db-vercel';

config();

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = request.body;
    
    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await getDbConnection();
    
    try {
      // Get user by email
      const [users] = await connection.query(
        'SELECT * FROM users WHERE email = ?', 
        [email]
      );
      
      if (!users || users.length === 0) {
        return response.status(401).json({ message: 'Invalid credentials' });
      }
      
      const user = users[0];
      
      // Compare password with hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return response.status(401).json({ message: 'Invalid credentials' });
      }
      
      // For Vercel serverless, we can't use sessions, so we'll return user data directly
      // In a real application, you would use JWT tokens for authentication
      const { password: _, ...userWithoutPassword } = user;
      
      // Get additional data based on role
      let userData = { ...userWithoutPassword };
      if (user.role === 'student') {
        const [students] = await connection.query(
          'SELECT * FROM students WHERE user_id = ?', 
          [user.id]
        );
        
        if (students && students.length > 0) {
          userData = { ...userData, student: students[0] };
        }
      }
      
      response.status(200).json({ user: userData });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Login error:', error);
    response.status(500).json({ message: 'Login failed' });
  }
}