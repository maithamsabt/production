# Vercel Deployment Guide

## Environment Variables Setup

Before deploying, configure these environment variables in your Vercel project:

### Required Variables:
1. **DATABASE_URL** - Your Neon PostgreSQL connection string
   ```
   postgresql://neondb_owner:npg_8mdLvYgnafp4@ep-late-salad-ahyjyfe0-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

2. **JWT_SECRET** - Secret key for JWT tokens
   ```
   your-super-secret-jwt-key-change-this-in-production-maitham-secure-key-2024
   ```

3. **VITE_ADMIN_USERNAME** - Admin username
   ```
   admin
   ```

4. **VITE_ADMIN_PASSWORD** - Admin password
   ```
   Maitham@11325
   ```

5. **VITE_API_URL** - API base URL (leave as `/api` for Vercel)
   ```
   /api
   ```

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
pnpm add -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Your Project
```bash
vercel link
```

### 4. Push Database Schema to Neon
```bash
pnpm db:push
```

### 5. Initialize Admin User
```bash
pnpm db:init
```

### 6. Deploy to Vercel
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 7. Set Environment Variables in Vercel Dashboard
Go to your project settings → Environment Variables and add all the variables listed above.

## Local Development with Vercel

To test the serverless functions locally with Vercel's dev server:

```bash
pnpm dev:vercel
```

This runs both the frontend and serverless API routes in a Vercel-like environment.

## Architecture

### Frontend (Vite + React)
- Built as static files in `/dist`
- Served by Vercel's CDN

### Backend (Serverless Functions)
- API routes in `/api` directory
- Each file is a serverless function
- Auto-scales with Vercel

### Database (Neon PostgreSQL)
- Serverless Postgres with connection pooling
- Schema managed by Drizzle ORM

## Post-Deployment

1. Access your app at the Vercel URL
2. Login with admin credentials (admin/Maitham@11325)
3. Start managing vendors, items, and comparisons!

## Troubleshooting

### If admin user doesn't exist:
Run the database initialization script:
```bash
DATABASE_URL=<your-neon-url> pnpm db:init
```

### If API routes return 500 errors:
Check Vercel function logs in the dashboard for detailed error messages.

### If database connection fails:
Verify DATABASE_URL in Vercel environment variables matches your Neon connection string.
