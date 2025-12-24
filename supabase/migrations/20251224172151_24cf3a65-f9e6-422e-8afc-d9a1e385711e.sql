-- Create system_settings table to store version info and update preferences
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (system info is not sensitive)
CREATE POLICY "System settings are readable by all authenticated users"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify (we'll check admin role in edge function)
CREATE POLICY "System settings are modifiable by authenticated users"
ON public.system_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create update_logs table to track update history
CREATE TABLE public.update_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for update_logs
ALTER TABLE public.update_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view update logs
CREATE POLICY "Update logs are readable by authenticated users"
ON public.update_logs
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert update logs
CREATE POLICY "Update logs are insertable by authenticated users"
ON public.update_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert initial system settings
INSERT INTO public.system_settings (key, value) VALUES
  ('version', '{"current": "1.0.0", "latest": "1.0.0", "lastChecked": null}'),
  ('portal', '{"url": "https://portal.itsupport.com.bd", "autoUpdate": true}'),
  ('system', '{"hostname": "AMPOS-SERVER", "installedAt": null}');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();