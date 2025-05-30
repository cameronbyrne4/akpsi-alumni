-- Create alumni table
CREATE TABLE alumni (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    current_role TEXT DEFAULT 'Unknown',
    current_company TEXT DEFAULT 'Unknown',
    current_industry TEXT DEFAULT 'Unknown',
    current_location TEXT DEFAULT 'Unknown',
    family_branch TEXT DEFAULT 'Unknown',
    graduation_year INTEGER CHECK (graduation_year >= 2000 AND graduation_year <= 2025),
    big_brother TEXT DEFAULT 'Unknown',
    little_brothers TEXT[] DEFAULT ARRAY[]::TEXT[],
    linkedin_url TEXT,
    source_sheet TEXT,
    has_linkedin BOOLEAN DEFAULT FALSE,
    scraped BOOLEAN DEFAULT FALSE,
    manually_verified BOOLEAN DEFAULT FALSE,
    data_last_updated DATE DEFAULT CURRENT_DATE,
    -- Career history stored as JSONB array
    career_history JSONB[] DEFAULT ARRAY[]::JSONB[],
    -- Multi-value fields stored as arrays
    majors TEXT[] DEFAULT ARRAY[]::TEXT[],
    minors TEXT[] DEFAULT ARRAY[]::TEXT[],
    emails TEXT[] DEFAULT ARRAY[]::TEXT[],
    phones TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common search fields
CREATE INDEX idx_alumni_name ON alumni(name);
CREATE INDEX idx_alumni_current_company ON alumni(current_company);
CREATE INDEX idx_alumni_current_industry ON alumni(current_industry);
CREATE INDEX idx_alumni_family_branch ON alumni(family_branch);
CREATE INDEX idx_alumni_graduation_year ON alumni(graduation_year);
CREATE INDEX idx_alumni_current_location ON alumni(current_location);
CREATE INDEX idx_alumni_data_last_updated ON alumni(data_last_updated);

-- Create GIN indexes for array fields to enable efficient searching
CREATE INDEX idx_alumni_career_history ON alumni USING GIN(career_history);
CREATE INDEX idx_alumni_majors ON alumni USING GIN(majors);
CREATE INDEX idx_alumni_emails ON alumni USING GIN(emails);
CREATE INDEX idx_alumni_phones ON alumni USING GIN(phones);
CREATE INDEX idx_alumni_little_brothers ON alumni USING GIN(little_brothers);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_alumni_updated_at
    BEFORE UPDATE ON alumni
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 