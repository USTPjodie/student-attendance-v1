// Vercel API handler
import express from 'express';
import serverless from 'serverless-http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Create express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Vercel API is working correctly'
  });
});

// Export for Vercel
export default serverless(app);