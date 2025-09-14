-- Add source and url columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'facebook';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS url TEXT;

-- Update existing leads to have 'facebook' as source if not already set
UPDATE leads SET source = 'facebook' WHERE source IS NULL;

-- Add index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
