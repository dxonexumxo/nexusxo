-- Add logo columns to manufacturers table
ALTER TABLE manufacturers 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_file_name TEXT,
ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create index for queries that filter by logo existence
CREATE INDEX IF NOT EXISTS idx_manufacturers_logo_url ON manufacturers(logo_url) WHERE logo_url IS NOT NULL;

-- Comments
COMMENT ON COLUMN manufacturers.logo_url IS 'Public URL to manufacturer logo stored in Supabase Storage';
COMMENT ON COLUMN manufacturers.logo_file_name IS 'Original filename of uploaded logo';
COMMENT ON COLUMN manufacturers.logo_uploaded_at IS 'Timestamp when logo was last uploaded or updated';

-- Note: Storage bucket and RLS policies must be created through Supabase Dashboard or API
-- Bucket name: manufacturer-logos
-- Public access: true (logos are public)
-- RLS policies:
--   - SELECT: Allow public read access (anyone can view logos)
--   - INSERT: Allow manufacturers to upload to their own folder (folder path = manufacturer_id)
--   - UPDATE: Allow manufacturers to update files in their own folder
--   - DELETE: Allow manufacturers to delete files from their own folder