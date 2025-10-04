// Vercel server configuration
import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

// Create express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticDir = join(__dirname, '..', 'dist', 'public');

// Check if we have built files
import { existsSync } from 'fs';
if (existsSync(staticDir)) {
  app.use(express.static(staticDir));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(join(staticDir, 'index.html'));
  });
}

// Export the app for Vercel
export default app;