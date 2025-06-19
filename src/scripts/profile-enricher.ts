import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabase, Alumni } from '../lib/supabase';
import fetch from 'node-fetch';

const CLADO_API_KEY = process.env.CLADO_API_KEY;
if (!CLADO_API_KEY) {
  throw new Error('Missing CLADO_API_KEY in environment variables');
}

async function enrichAlumniProfiles() {
  // Fetch all alumni with has_linkedin=true and a non-null linkedin_url
  const { data: alumni, error } = await supabase
    .from('alumni')
    .select('*')
    .eq('has_linkedin', true)
    .not('linkedin_url', 'is', null);

  if (error) {
    console.error('Error fetching alumni:', error);
    return;
  }
  if (!alumni || alumni.length === 0) {
    console.log('No alumni found with has_linkedin=true and a linkedin_url.');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const alum of alumni) {
    const url = alum.linkedin_url;
    try {
      const res = await fetch(
        `https://search.linkd.inc/api/enrich/linkedin?url=${encodeURIComponent(url!)}`,
        {
          headers: {
            'Authorization': `Bearer ${CLADO_API_KEY}`,
          },
        }
      );
      const result = await res.json();
      if (result.data && result.data[0] && result.data[0].profile) {
        const profile = result.data[0].profile;
        // Map Clado fields to alumni columns
        const updates: Partial<Alumni> = {
          name: profile.name,
          location: profile.location,
          role: profile.title,
          bio: profile.description,
          picture_url: profile.profile_picture_url,
          linkedin_url: profile.linkedin_url,
          // You can add more mappings here as needed
        };
        // Optionally map companies, education, etc.
        if (result.data[0].experience) {
          updates.companies = result.data[0].experience.map((exp: any) => exp.company_name).filter(Boolean);
        }
        if (result.data[0].education) {
          updates.majors = result.data[0].education.map((edu: any) => edu.field_of_study).filter(Boolean);
          updates.career_history = result.data[0].education.map((edu: any) => edu.school_name).filter(Boolean);
        }
        // Overwrite all fields with Clado data
        const { error: updateError } = await supabase
          .from('alumni')
          .update(updates)
          .eq('id', alum.id);
        if (updateError) {
          console.error(`Error updating alumni ${alum.id}:`, updateError);
          failed++;
        } else {
          console.log(`Updated alumni ${alum.name || alum.id}`);
          updated++;
        }
      } else {
        console.log(`No Clado data for ${alum.name || alum.id}`);
        failed++;
      }
    } catch (err) {
      console.error(`Error enriching alumni ${alum.name || alum.id}:`, err);
      failed++;
    }
    // Delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

enrichAlumniProfiles(); 