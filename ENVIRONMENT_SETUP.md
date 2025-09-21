# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the Frontend directory with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://138.197.26.207:5000

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## For Vercel Deployment

Add these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to Environment Variables
3. Add `NEXT_PUBLIC_API_BASE_URL` with value `http://138.197.26.207:5000`
4. Add your Supabase variables if using Supabase

## Backend Issues

Your backend is missing the `bcryptjs` dependency. Run this on your server:

```bash
cd /root/Backend/LeadFinderBackend
npm install bcryptjs
pm2 restart leadfinder
```



