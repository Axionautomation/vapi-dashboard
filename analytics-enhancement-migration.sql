-- Analytics Enhancement Migration for Assistants Table
-- Run this to enhance the assistants table for better analytics tracking

-- Add analytics-related columns to assistants table
ALTER TABLE public.assistants 
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_duration_seconds DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS analytics_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create analytics_cache table for better performance
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE CASCADE,
  date_range VARCHAR(50) NOT NULL, -- 'lastWeek', 'lastMonth', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cache_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  
  -- Unique constraint to prevent duplicate cache entries
  UNIQUE(user_id, assistant_id, date_range, start_date, end_date)
);

-- Create index for faster cache lookups
CREATE INDEX IF NOT EXISTS idx_analytics_cache_lookup 
ON public.analytics_cache(user_id, date_range, expires_at);

-- Enable RLS on analytics_cache
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_cache
CREATE POLICY "Users can view their own analytics cache" ON public.analytics_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics cache" ON public.analytics_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics cache" ON public.analytics_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics cache" ON public.analytics_cache
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analytics_cache 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to update assistant analytics
CREATE OR REPLACE FUNCTION update_assistant_analytics(
  p_user_id UUID,
  p_vapi_assistant_id TEXT,
  p_total_calls INTEGER,
  p_successful_calls INTEGER,
  p_failed_calls INTEGER,
  p_avg_duration_seconds DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE public.assistants 
  SET 
    total_calls = p_total_calls,
    successful_calls = p_successful_calls,
    failed_calls = p_failed_calls,
    avg_duration_seconds = p_avg_duration_seconds,
    last_call_at = NOW(),
    analytics_last_updated = NOW()
  WHERE 
    user_id = p_user_id 
    AND vapi_assistant_id = p_vapi_assistant_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.analytics_cache IS 'Caches analytics data to reduce API calls to Vapi';
COMMENT ON COLUMN public.assistants.total_calls IS 'Total number of calls made by this assistant';
COMMENT ON COLUMN public.assistants.successful_calls IS 'Number of successful calls';
COMMENT ON COLUMN public.assistants.failed_calls IS 'Number of failed calls';
COMMENT ON COLUMN public.assistants.avg_duration_seconds IS 'Average call duration in seconds';
COMMENT ON COLUMN public.assistants.last_call_at IS 'Timestamp of the most recent call';
COMMENT ON COLUMN public.assistants.analytics_last_updated IS 'When analytics were last refreshed from Vapi';
