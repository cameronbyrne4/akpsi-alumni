import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface CareerExperience {
  title: string; // Software Engineer or Product Manager or etc.
  company_name: string; // Google or Apple or etc.
  start_date: string; // 2020-01-01
  end_date: string | null; // 2024-01-01 or null if still working there
  description?: string; // Hide on alumni cards for simplicity
  location?: string;
  company_logo?: string;
}

export interface Education {
  degree: string; // BS or MS or PHD
  field_of_study: string; // Computer Science or Business or Engineering or etc.
  school_name: string; // University of California, Berkeley or Stanford University or etc.
  school_logo?: string; // URL to the school logo
  start_date: string; // 2020-01-01
  end_date: string | null; // 2024-01-01 or null if still studying
  description?: string; // Hide on alumni cards for simplicity
}

export type Alumni = {
  id: string
  name: string
  linkedin_url?: string
  picture_url?: string
  bio?: string
  role?: string  // Should be optional since DB allows NULL
  companies?: string[]  // Should be optional since you're creating empty records
  big_brother?: string
  little_brothers?: string[]
  family_branch?: string  // Should be optional since DB allows NULL
  graduation_year?: number  // Should be optional since DB allows NULL
  location?: string  // Should be optional since DB allows NULL
  has_linkedin: boolean
  scraped: boolean
  manually_verified: boolean
  has_enrichment:boolean
  source_sheet?: string[]
  created_at?: string  // Usually auto-generated
  emails?: string[]  // Match DB column name
  phones?: string[]  // Match DB column name
  majors?: string[]  // Match DB column name
  minors?: string[]  // Match DB column name
  career_history?: CareerExperience[]; // JSONB array of career objects
  education?: Education[]; // JSONB array of education objects
}