# 🗄️ Database Setup Guide

## Setting Up the Assistants Table

To use the Vapi Assistant Management feature, you need to create the database table in your Supabase project.

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`riyfvqwymwvfdlzjmplt`)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Database Setup Script

1. Click **New Query**
2. Copy and paste the contents of `database-setup.sql` into the editor
3. Click **Run** to execute the script

### Step 3: Verify the Setup

After running the script, you should see:
- ✅ A new `assistants` table created
- ✅ Row Level Security (RLS) enabled
- ✅ Security policies configured
- ✅ Indexes created for performance

### Step 4: Test the Integration

1. Restart your development server: `npm run dev`
2. Navigate to [http://localhost:3000/assistants](http://localhost:3000/assistants)
3. Try adding a Vapi Assistant ID

## Database Schema

The `assistants` table includes:

- **id**: Unique identifier (UUID)
- **user_id**: Links to the authenticated user
- **vapi_assistant_id**: The Vapi Assistant ID
- **name**: Display name for the assistant
- **description**: Optional description
- **model**: AI model used (e.g., "gpt-4o")
- **voice**: Voice ID used (e.g., "alloy")
- **first_message**: The assistant's greeting message
- **metadata**: Additional JSON data from Vapi
- **created_at**: When the assistant was added
- **updated_at**: Last modification time

## Security Features

- **Row Level Security (RLS)**: Users can only see their own assistants
- **Unique Constraints**: Each user can only have one entry per Vapi Assistant ID
- **Automatic Timestamps**: `updated_at` is automatically updated on changes

## Troubleshooting

### "Table does not exist" Error
- Make sure you ran the SQL script in the correct Supabase project
- Check that the table was created in the **Table Editor**

### "Permission denied" Error
- Verify that RLS policies are properly configured
- Check that the user is authenticated

### "Duplicate key" Error
- Each Vapi Assistant ID can only be added once per user
- Use a different Assistant ID or delete the existing one first 