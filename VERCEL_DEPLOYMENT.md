# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. A MySQL database (you can use PlanetScale, Supabase, or any hosted MySQL service)

## Deployment Steps

### 1. Prepare Your Database

Before deploying to Vercel, you need to set up a MySQL database. You can use:

- **PlanetScale** (recommended for serverless)
- **Supabase**
- **AWS RDS**
- **Google Cloud SQL**
- Any hosted MySQL service

### 2. Set Up Environment Variables in Vercel

In your Vercel project dashboard, go to Settings → Environment Variables and add:

```bash
# Database Configuration
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# Session Configuration
SESSION_SECRET=your-session-secret-here-change-in-production

# API Configuration
NODE_ENV=production
```

### 3. Deploy to Vercel

You can deploy in two ways:

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. Connect Vercel to your GitHub repository
3. Configure the project with these settings:
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

#### Option B: Deploy using Vercel CLI

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel --prod`

### 4. Initialize Database Schema

After deployment, you'll need to initialize your database schema. You can do this by:

1. Connecting to your database directly
2. Running the schema.sql file
3. Or creating an initialization endpoint in your API

### API Endpoints

The application provides the following API endpoints:

- `GET /api/health` - Health check endpoint
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/classes` - Get classes
- `POST /api/classes` - Create class
- `GET /api/students` - Get students
- `GET /api/student/classes` - Get classes for current student
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/stats/:studentId` - Get attendance stats
- `GET /api/consultations` - Get consultations
- `POST /api/consultations` - Create consultation
- `PATCH /api/consultations/:id` - Update consultation
- `GET /api/grades` - Get grades
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/availability` - Get teacher availability
- `POST /api/availability` - Update teacher availability
- `GET /api/availability/:teacherId/slots` - Get available time slots
- `GET /api/availability/:teacherId` - Get specific teacher availability
- `GET /api/teachers` - Get all teachers

### Troubleshooting

#### 404 Errors

If you're getting 404 errors:

1. Make sure your routes are correctly configured in `vercel.json`
2. Verify that your API files are in the correct locations
3. Check that your build command is working correctly

#### Database Connection Issues

If you're having database connection issues:

1. Verify all database environment variables are set correctly
2. Ensure your database allows connections from Vercel's IP addresses
3. Check that your database credentials are correct

#### Build Failures

If your build is failing:

1. Make sure all dependencies are correctly listed in `package.json`
2. Check that your build command (`npm run build`) works locally
3. Verify that your TypeScript compiles without errors

### Local Development vs Production

This application is designed to work in both local development (with Docker) and production (on Vercel). The key differences are:

1. **Database**: Local development uses Docker MySQL, production uses a hosted database
2. **Environment Variables**: Different configurations for each environment
3. **Static Files**: In production, static files are served from the `dist/public` directory
4. **API Routes**: In production, API routes are handled by Vercel serverless functions

### Support

For issues with deployment, please check:
1. Vercel logs in the dashboard
2. Make sure all environment variables are set
3. Verify your database connection