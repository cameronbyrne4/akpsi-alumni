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
  role: string
  companies: string[]
  industry: string
  big_brother?: string
  little_brothers?: string[]
  family_branch: string
  graduation_year: number
  location: string
  has_linkedin: boolean
  scraped: boolean
  manually_verified: boolean
  source_sheet?: string
  created_at: string
  email?: string
  phone?: string
  major?: string
  minor?: string
} 