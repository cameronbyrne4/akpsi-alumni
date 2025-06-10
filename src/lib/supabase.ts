import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Alumni = {
  id: string
  name: string
  linkedin_url?: string
  picture_url?: string
  bio?: string
  role?: string  // Should be optional since DB allows NULL
  companies?: string[]  // Should be optional since you're creating empty records
  industry?: string[]
  big_brother?: string
  little_brothers?: string[]
  family_branch?: string  // Should be optional since DB allows NULL
  graduation_year?: number  // Should be optional since DB allows NULL
  location?: string  // Should be optional since DB allows NULL
  has_linkedin: boolean
  scraped: boolean
  manually_verified: boolean
  source_sheet?: string[]
  created_at?: string  // Usually auto-generated
  emails?: string[]  // Match DB column name
  phones?: string[]  // Match DB column name
  majors?: string[]  // Match DB column name
  minors?: string[]  // Match DB column name
  career_history?: string[]  // Add missing field from DB
}