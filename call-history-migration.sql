-- Call History Migration
-- Run this to create the call_history table for storing Vapi call data

-- Create call_history table
CREATE TABLE IF NOT EXISTS public.call_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  vapi_call_id TEXT NOT NULL UNIQUE,
  assistant_name TEXT NOT NULL,
  status TEXT NOT NULL,
  ended_reason TEXT,
  duration INTEGER, -- in seconds
  cost DECIMAL(10,4),
  phone_number TEXT,
  transcript TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for better performance
  CONSTRAINT call_history_vapi_call_id_unique UNIQUE(vapi_call_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_call_history_user_id ON public.call_history(user_id);
CREATE INDEX IF NOT EXISTS idx_call_history_assistant_id ON public.call_history(assistant_id);
CREATE INDEX IF NOT EXISTS idx_call_history_created_at ON public.call_history(created_at);
CREATE INDEX IF NOT EXISTS idx_call_history_status ON public.call_history(status);
CREATE INDEX IF NOT EXISTS idx_call_history_user_created_at ON public.call_history(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own call history" ON public.call_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call history" ON public.call_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call history" ON public.call_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update call history
CREATE OR REPLACE FUNCTION update_call_history(
  p_user_id UUID,
  p_assistant_id UUID,
  p_vapi_call_id TEXT,
  p_assistant_name TEXT,
  p_status TEXT,
  p_ended_reason TEXT DEFAULT NULL,
  p_duration INTEGER DEFAULT NULL,
  p_cost DECIMAL DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL,
  p_transcript TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.call_history (
    user_id,
    assistant_id,
    vapi_call_id,
    assistant_name,
    status,
    ended_reason,
    duration,
    cost,
    phone_number,
    transcript,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_assistant_id,
    p_vapi_call_id,
    p_assistant_name,
    p_status,
    p_ended_reason,
    p_duration,
    p_cost,
    p_phone_number,
    p_transcript,
    p_metadata,
    p_created_at
  )
  ON CONFLICT (vapi_call_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    ended_reason = EXCLUDED.ended_reason,
    duration = EXCLUDED.duration,
    cost = EXCLUDED.cost,
    phone_number = EXCLUDED.phone_number,
    transcript = EXCLUDED.transcript,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.call_history IS 'Stores call history data fetched from Vapi API';
COMMENT ON COLUMN public.call_history.vapi_call_id IS 'Unique call ID from Vapi API';
COMMENT ON COLUMN public.call_history.status IS 'Call status: created, ringing, in-progress, ended, etc.';
COMMENT ON COLUMN public.call_history.ended_reason IS 'Reason call ended: assistant-ended-call, no-answer, busy, etc.';
COMMENT ON COLUMN public.call_history.duration IS 'Call duration in seconds';
COMMENT ON COLUMN public.call_history.cost IS 'Call cost in USD';
COMMENT ON COLUMN public.call_history.transcript IS 'Call transcript if available';
