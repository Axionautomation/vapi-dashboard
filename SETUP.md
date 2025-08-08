# 🚀 Quick Setup Guide

## Step 1: Get Your Supabase Credentials

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Create a new project** or select an existing one
3. **Go to Project Settings** → **API**
4. **Copy your credentials**:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 2: Update Environment Variables

Edit your `.env.local` file and replace the placeholder values:

```env
# Replace these with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for future features)
OPENAI_API_KEY=your_openai_api_key
VAPI_API_KEY=your_vapi_api_key
```

## Step 3: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 4: Test the Application

1. Open [http://localhost:3000](http://localhost:3000)
2. You should be redirected to the login page
3. Create a new account or sign in
4. Explore the dashboard!

## Troubleshooting

### "Invalid URL" Error
- Make sure your `NEXT_PUBLIC_SUPABASE_URL` starts with `https://`
- Check that you copied the entire URL from Supabase

### "Missing environment variables" Error
- Ensure your `.env.local` file is in the project root
- Verify that the variable names are exactly as shown above
- Restart the development server after making changes

### Authentication Issues
- Check that your Supabase project has email authentication enabled
- Go to Authentication → Settings in your Supabase dashboard
- Ensure "Enable email confirmations" is configured as needed 