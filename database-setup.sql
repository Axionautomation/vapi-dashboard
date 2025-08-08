-- Create assistants table for storing Vapi assistant information
CREATE TABLE IF NOT EXISTS assistants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vapi_assistant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT,
  voice TEXT,
  first_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each user can only have one entry per Vapi assistant ID
  UNIQUE(user_id, vapi_assistant_id)
);

-- Enable Row Level Security
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own assistants" ON assistants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assistants" ON assistants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assistants" ON assistants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assistants" ON assistants
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assistants_user_id ON assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_vapi_id ON assistants(vapi_assistant_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 