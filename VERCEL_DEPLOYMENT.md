# Deploying to Vercel

## Prerequisites
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm install -g vercel`

## Deployment Steps

### Option 1: Deploy using Vercel CLI
1. Build the project locally:
   ```bash
   npm run build
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your project

### Option 2: Deploy using Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Import your project in Vercel dashboard
3. Vercel will automatically detect the project settings and deploy

## Environment Variables
You'll need to set the following environment variables in your Vercel project settings:

- `DB_HOST` - Database host
- `DB_PORT` - Database port (usually 3306 for MySQL)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `SESSION_SECRET` - Secret for session management

## Important Notes
1. This application requires a MySQL database
2. The build process creates both frontend and backend artifacts
3. API routes are served under `/api/` prefix
4. Static files are served from the built frontend

## Custom Domain
After deployment, you can add a custom domain in your Vercel project settings.