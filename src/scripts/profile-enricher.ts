import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
const rootDir = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Try both prefixed and non-prefixed versions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env.local in:', path.join(rootDir, '.env.local'));
  console.error('Available env vars:', Object.keys(process.env));
  throw new Error('Missing Supabase environment variables. Please check your .env.local file for either NEXT_PUBLIC_SUPABASE_URL/KEY or SUPABASE_URL/KEY.');
}

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseKey);

import { Alumni } from '../lib/supabase';
import fetch from 'node-fetch';
import readline from 'readline';

const CLADO_API_KEY = process.env.CLADO_API_KEY;
const CRUST_API_KEY = process.env.CRUST_API_KEY;

if (!CLADO_API_KEY) {
  throw new Error('Missing CLADO_API_KEY in environment variables');
}
if (!CRUST_API_KEY) {
  throw new Error('Missing CRUST_API_KEY in environment variables');
}

// Helper function to format location for database compatibility
function formatLocation(location: string): string {
  if (!location) return location;
  
  // Convert "San Francisco, California, United States" to "San Francisco, CA"
  const parts = location.split(', ').map(part => part.trim());
  
  if (parts.length >= 2) {
    const city = parts[0];
    const state = parts[1];
    
    // State abbreviation mapping
    const stateMap: { [key: string]: string } = {
      'California': 'CA',
      'New York': 'NY',
      'Texas': 'TX',
      'Florida': 'FL',
      'Illinois': 'IL',
      'Pennsylvania': 'PA',
      'Ohio': 'OH',
      'Georgia': 'GA',
      'North Carolina': 'NC',
      'Michigan': 'MI',
      'New Jersey': 'NJ',
      'Virginia': 'VA',
      'Washington': 'WA',
      'Massachusetts': 'MA',
      'Arizona': 'AZ',
      'Indiana': 'IN',
      'Tennessee': 'TN',
      'Missouri': 'MO',
      'Maryland': 'MD',
      'Colorado': 'CO',
      'Wisconsin': 'WI',
      'Minnesota': 'MN',
      'South Carolina': 'SC',
      'Alabama': 'AL',
      'Louisiana': 'LA',
      'Kentucky': 'KY',
      'Oregon': 'OR',
      'Oklahoma': 'OK',
      'Connecticut': 'CT',
      'Utah': 'UT',
      'Iowa': 'IA',
      'Nevada': 'NV',
      'Arkansas': 'AR',
      'Mississippi': 'MS',
      'Kansas': 'KS',
      'New Mexico': 'NM',
      'Nebraska': 'NE',
      'West Virginia': 'WV',
      'Idaho': 'ID',
      'Hawaii': 'HI',
      'New Hampshire': 'NH',
      'Maine': 'ME',
      'Montana': 'MT',
      'Rhode Island': 'RI',
      'Delaware': 'DE',
      'South Dakota': 'SD',
      'North Dakota': 'ND',
      'Alaska': 'AK',
      'Vermont': 'VT',
      'Wyoming': 'WY'
    };
    
    const stateAbbr = stateMap[state] || state;
    return `${city}, ${stateAbbr}`;
  }
  
  return location;
}

// Helper function to transform Crust career data to match Clado format
function transformCrustCareerData(currentEmployers: any[], pastEmployers: any[]): any[] {
  const allEmployers = [...(currentEmployers || []), ...(pastEmployers || [])];
  
  return allEmployers.map(employer => ({
    title: employer.employee_title,
    company_name: employer.employer_name,
    start_date: employer.start_date,
    end_date: employer.end_date,
    description: employer.employee_description,
    location: employer.employee_location,
    // No company_logo from Crust
  }));
}

// Helper function to transform Crust education data to match Clado format
function transformCrustEducationData(allSchools: string[], allDegrees: string[]): any[] {
  const education = [];
  const maxLength = Math.max(allSchools?.length || 0, allDegrees?.length || 0);
  
  for (let i = 0; i < maxLength; i++) {
    education.push({
      degree: allDegrees?.[i] || '',
      field_of_study: '', // Crust doesn't provide this
      school_name: allSchools?.[i] || '',
      // No school_logo from Crust
      start_date: '', // Crust doesn't provide this
      end_date: '', // Crust doesn't provide this
      description: '' // Crust doesn't provide this
    });
  }
  
  return education;
}

// Try Clado enrichment
async function tryCladoEnrichment(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(
      `https://search.linkd.inc/api/enrich/linkedin?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'Authorization': `Bearer ${CLADO_API_KEY}`,
        },
      }
    );
    
    console.log(`Clado Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      return { 
        success: false, 
        error: `Clado HTTP ${res.status}: ${errorText}` 
      };
    }
    
    const result = await res.json();
    
    if (result.data && result.data[0] && result.data[0].profile) {
      return { success: true, data: result.data[0] };
    } else {
      return { success: false, error: 'No Clado data found' };
    }
  } catch (err) {
    return { success: false, error: `Clado error: ${err}` };
  }
}

// Try Crust enrichment
async function tryCrustEnrichment(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(
      `https://api.crustdata.com/screener/person/enrich?linkedin_profile_url=${encodeURIComponent(url)}`,
      {
        headers: {
          'Authorization': `Token ${CRUST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`Crust Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      return { 
        success: false, 
        error: `Crust HTTP ${res.status}: ${errorText}` 
      };
    }
    
    const result = await res.json();
    
    if (result && result.length > 0 && result[0]) {
      return { success: true, data: result[0] };
    } else {
      return { success: false, error: 'No Crust data found' };
    }
  } catch (err) {
    return { success: false, error: `Crust error: ${err}` };
  }
}

// Determine if we should fallback to Crust based on Clado error
function shouldFallbackToCrust(cladoError: string): boolean {
  // Don't fallback for these Clado errors:
  // - 401 (Unauthorized) - API key issue, Crust won't help
  // - 400 (Bad Request) - Invalid URL, Crust won't help either
  
  if (cladoError.includes('401') || cladoError.includes('Unauthorized')) {
    return false; // API key issue
  }
  
  if (cladoError.includes('400') || cladoError.includes('Bad Request')) {
    return false; // Invalid URL
  }
  
  // DO fallback for these (including "no data found"):
  // - 402 (Payment Required) - Out of credits, try Crust
  // - 500 (Server Error) - Clado server issue, try Crust
  // - 404 / "No data found" - Different APIs might have different coverage, worth trying Crust
  // - Any other error - Worth trying Crust
  
  return true;
}

async function enrichAlumniProfiles() {
  // Fetch all alumni with has_linkedin=true and a non-null linkedin_url
  const { data: alumni, error } = await supabase
    .from('alumni')
    .select('*')
    .eq('has_linkedin', true)
    .not('linkedin_url', 'is', null)
    .eq('has_enrichment', false);

  if (error) {
    console.error('Error fetching alumni:', error);
    return;
  }
  if (!alumni || alumni.length === 0) {
    console.log('No alumni found with has_linkedin=true and a linkedin_url.');
    return;
  }

  console.log(`\nFound ${alumni.length} profiles to enrich. Processing in batches of 20...`);

  // Manual break: wait for user confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  // Choose enrichment mode
  const mode = await new Promise<string>((resolve) => {
    rl.question(`\nEnrichment mode:
1. Auto (Clado → Crust fallback) - Recommended
2. Clado only (1 credit per profile)
3. Crust only (3 credits per profile)
4. Manual per profile (you choose for each)

Choose mode (1-4): `, (answer) => {
      resolve(answer.trim());
    });
  });
  
  let enrichmentMode: 'auto' | 'clado' | 'crust' | 'manual';
  
  switch (mode) {
    case '1':
      enrichmentMode = 'auto';
      console.log('✅ Using Auto mode (Clado → Crust fallback)');
      break;
    case '2':
      enrichmentMode = 'clado';
      console.log('✅ Using Clado only mode');
      break;
    case '3':
      enrichmentMode = 'crust';
      console.log('✅ Using Crust only mode');
      break;
    case '4':
      enrichmentMode = 'manual';
      console.log('✅ Using Manual mode (you will choose for each profile)');
      break;
    default:
      enrichmentMode = 'auto';
      console.log('⚠️ Invalid choice, defaulting to Auto mode');
  }
  
  await new Promise<void>((resolve) => {
    rl.question('\nPress Enter to continue with enrichment, or Ctrl+C to abort...', () => {
      rl.close();
      resolve();
    });
  });

  let updated = 0;
  let failed = 0;
  let cladoSuccess = 0;
  let crustSuccess = 0;

  // Process in batches of 20
  for (let i = 0; i < alumni.length; i += 20) {
    const batch = alumni.slice(i, i + 20);
    console.log(`\n--- Processing batch ${Math.floor(i/20) + 1}/${Math.ceil(alumni.length/20)} (${batch.length} profiles) ---`);
    
    for (const alum of batch) {
      const url = alum.linkedin_url;
      console.log(`\n--- Enriching ${alum.name || alum.id} ---`);
      console.log(`URL: ${url}`);
      
      let enrichmentSuccess = false;
      let updates: Partial<Alumni> = {};
      let enrichmentSource = '';
      
      // Handle different enrichment modes
      switch (enrichmentMode) {
        case 'auto':
          // Try Clado first, then Crust as fallback
          const cladoResult = await tryCladoEnrichment(url!);
          
          if (cladoResult.success) {
            console.log('✅ Using Clado data');
            enrichmentSource = 'Clado';
            cladoSuccess++;
            
            const data = cladoResult.data;
            const profile = data.profile;
            
            // Update profile fields if available
            if (profile) {
              updates.location = formatLocation(profile.location);
              updates.role = profile.title;
              updates.bio = profile.description;
              updates.picture_url = profile.profile_picture_url;
            }

            // Update experience if available
            if (data.experience) {
              updates.career_history = data.experience;
            }

            // Update education if available
            if (data.education) {
              updates.education = data.education;
            }
            
            enrichmentSuccess = true;
          } else {
            // Clado failed - determine if we should try Crust
            const shouldTryCrust = shouldFallbackToCrust(cladoResult.error || 'Unknown error');
            
            if (shouldTryCrust) {
              console.log('🔄 Clado failed, trying Crust as fallback...');
              
              // Try Crust as fallback
              const crustResult = await tryCrustEnrichment(url!);
              
              if (crustResult.success) {
                console.log('✅ Using Crust data');
                enrichmentSource = 'Crust';
                crustSuccess++;
                
                const data = crustResult.data;
                
                // Map Crust fields to our format
                if (data.location) {
                  updates.location = formatLocation(data.location);
                }
                if (data.title) {
                  updates.role = data.title;
                }
                if (data.summary) {
                  updates.bio = data.summary;
                }
                if (data.profile_picture_url) {
                  updates.picture_url = data.profile_picture_url;
                }
                
                // Add non-duplicate emails
                if (data.emails && Array.isArray(data.emails)) {
                  const existingEmails = alum.emails || [];
                  const newEmails = data.emails.filter((email: string) => !existingEmails.includes(email));
                  if (newEmails.length > 0) {
                    updates.emails = [...existingEmails, ...newEmails];
                  }
                }
                
                // Transform career data
                if (data.current_employers || data.past_employers) {
                  updates.career_history = transformCrustCareerData(data.current_employers, data.past_employers);
                }
                
                // Transform education data
                if (data.all_schools || data.all_degrees) {
                  updates.education = transformCrustEducationData(data.all_schools, data.all_degrees);
                }
                
                enrichmentSuccess = true;
              } else {
                console.log(`❌ Crust also failed: ${crustResult.error}`);
              }
            } else {
              console.log(`❌ Clado failed and no fallback needed: ${cladoResult.error}`);
            }
          }
          break;
          
        case 'clado':
          // Use Clado only
          const cladoOnlyResult = await tryCladoEnrichment(url!);
          
          if (cladoOnlyResult.success) {
            console.log('✅ Using Clado data');
            enrichmentSource = 'Clado';
            cladoSuccess++;
            
            const data = cladoOnlyResult.data;
            const profile = data.profile;
            
            // Update profile fields if available
            if (profile) {
              updates.location = formatLocation(profile.location);
              updates.role = profile.title;
              updates.bio = profile.description;
              updates.picture_url = profile.profile_picture_url;
            }

            // Update experience if available
            if (data.experience) {
              updates.career_history = data.experience;
            }

            // Update education if available
            if (data.education) {
              updates.education = data.education;
            }
            
            enrichmentSuccess = true;
          } else {
            console.log(`❌ Clado failed: ${cladoOnlyResult.error}`);
          }
          break;
          
        case 'crust':
          // Use Crust only
          const crustOnlyResult = await tryCrustEnrichment(url!);
          
          if (crustOnlyResult.success) {
            console.log('✅ Using Crust data');
            enrichmentSource = 'Crust';
            crustSuccess++;
            
            const data = crustOnlyResult.data;
            
            // Map Crust fields to our format
            if (data.location) {
              updates.location = formatLocation(data.location);
            }
            if (data.title) {
              updates.role = data.title;
            }
            if (data.summary) {
              updates.bio = data.summary;
            }
            if (data.profile_picture_url) {
              updates.picture_url = data.profile_picture_url;
            }
            
            // Add non-duplicate emails
            if (data.emails && Array.isArray(data.emails)) {
              const existingEmails = alum.emails || [];
              const newEmails = data.emails.filter((email: string) => !existingEmails.includes(email));
              if (newEmails.length > 0) {
                updates.emails = [...existingEmails, ...newEmails];
              }
            }
            
            // Transform career data
            if (data.current_employers || data.past_employers) {
              updates.career_history = transformCrustCareerData(data.current_employers, data.past_employers);
            }
            
            // Transform education data
            if (data.all_schools || data.all_degrees) {
              updates.education = transformCrustEducationData(data.all_schools, data.all_degrees);
            }
            
            enrichmentSuccess = true;
          } else {
            console.log(`❌ Crust failed: ${crustOnlyResult.error}`);
          }
          break;
          
        case 'manual':
          // Manual choice per profile
          const manualRl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          
          const manualChoice = await new Promise<string>((resolve) => {
            manualRl.question(`\nProfile: ${alum.name || alum.id}\nChoose API (c=Clado, r=Crust, s=Skip): `, (answer) => {
              manualRl.close();
              resolve(answer.toLowerCase().trim());
            });
          });
          
          if (manualChoice === 'c') {
            // Use Clado
            const manualCladoResult = await tryCladoEnrichment(url!);
            if (manualCladoResult.success) {
              console.log('✅ Using Clado data');
              enrichmentSource = 'Clado';
              cladoSuccess++;
              
              const data = manualCladoResult.data;
              const profile = data.profile;
              
              if (profile) {
                updates.location = formatLocation(profile.location);
                updates.role = profile.title;
                updates.bio = profile.description;
                updates.picture_url = profile.profile_picture_url;
              }
              if (data.experience) {
                updates.career_history = data.experience;
              }
              if (data.education) {
                updates.education = data.education;
              }
              
              enrichmentSuccess = true;
            } else {
              console.log(`❌ Clado failed: ${manualCladoResult.error}`);
            }
          } else if (manualChoice === 'r') {
            // Use Crust
            const manualCrustResult = await tryCrustEnrichment(url!);
            if (manualCrustResult.success) {
              console.log('✅ Using Crust data');
              enrichmentSource = 'Crust';
              crustSuccess++;
              
              const data = manualCrustResult.data;
              
              if (data.location) {
                updates.location = formatLocation(data.location);
              }
              if (data.title) {
                updates.role = data.title;
              }
              if (data.summary) {
                updates.bio = data.summary;
              }
              if (data.profile_picture_url) {
                updates.picture_url = data.profile_picture_url;
              }
              
              if (data.emails && Array.isArray(data.emails)) {
                const existingEmails = alum.emails || [];
                const newEmails = data.emails.filter((email: string) => !existingEmails.includes(email));
                if (newEmails.length > 0) {
                  updates.emails = [...existingEmails, ...newEmails];
                }
              }
              
              if (data.current_employers || data.past_employers) {
                updates.career_history = transformCrustCareerData(data.current_employers, data.past_employers);
              }
              
              if (data.all_schools || data.all_degrees) {
                updates.education = transformCrustEducationData(data.all_schools, data.all_degrees);
              }
              
              enrichmentSuccess = true;
            } else {
              console.log(`❌ Crust failed: ${manualCrustResult.error}`);
            }
          } else if (manualChoice === 's') {
            // Skip this profile
            console.log('⏭️ Skipping profile');
            continue;
          } else {
            console.log('⚠️ Invalid choice, skipping profile');
            continue;
          }
          break;
      }
      
      // Update database if we got any data
      if (enrichmentSuccess && Object.keys(updates).length > 0) {
        updates.has_enrichment = true;
        
        const { error: updateError } = await supabase
          .from('alumni')
          .update(updates)
          .eq('id', alum.id);
          
        if (updateError) {
          console.error(`Error updating alumni ${alum.id}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Updated alumni ${alum.name || alum.id}`);
          updated++;
        }
      } else {
        console.log(`❌ No enrichment data found for ${alum.name || alum.id}`);
        // Don't mark as failed - leave has_enrichment as false so it can be retried later
      }
      
      // Delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Delay between batches
    if (i + 20 < alumni.length) {
      console.log('\n--- Waiting 5 seconds before next batch ---');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  console.log(`\n=== ENRICHMENT COMPLETE ===`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔵 Clado successes: ${cladoSuccess}`);
  console.log(`🟡 Crust successes: ${crustSuccess}`);
  console.log(`📊 Total processed: ${alumni.length}`);
}

enrichAlumniProfiles(); 