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


function normalizeLinkedInUrl(url: string): { clean: string, needsManual: boolean, reason?: string } {
  let original = url.trim();
  let needsManual = false;
  let reason = '';

  // Remove trailing slashes and whitespace
  original = original.replace(/\/$/, '').trim();

  // Lowercase the domain part
  original = original.replace(/^(https?:\/\/)?(www\.)?linkedin\.com/i, (match) => match.toLowerCase());

  // Add protocol if missing
  if (!/^https?:\/\//.test(original)) {
    original = 'https://' + original;
  }

  // Add www if missing
  original = original.replace(/^(https?:\/\/)(?!www\.)/, '$1www.');

  // Convert http to https
  original = original.replace(/^http:\/\//, 'https://');

  // If /pub/ URL, convert to /in/ format
  const pubMatch = original.match(/linkedin\.com\/pub\/([a-zA-Z0-9-]+)\/([0-9a-zA-Z]+)\/([0-9a-zA-Z]+)\/([0-9a-zA-Z]+)/);
  if (pubMatch) {
    const name = pubMatch[1];
    // Pad each segment to at least 2 chars
    const a = pubMatch[2].padStart(2, '0');
    const b = pubMatch[3].padStart(2, '0');
    const c = pubMatch[4].padStart(2, '0');
    original = `https://www.linkedin.com/in/${name}-${c}${b}${a}`;
  }

  // If not /in/ URL, try to fix
  if (!/linkedin\.com\/in\//.test(original)) {
    // If it's a profile with a username, try to convert
    const match = original.match(/linkedin\.com\/(?:profile|[a-z]{2,})\/([a-zA-Z0-9\-_.]+)/);
    if (match) {
      original = original.replace(/linkedin\.com\/(?:profile|[a-z]{2,})\//, 'linkedin.com/in/');
    } else {
      needsManual = true;
      reason = 'Unknown LinkedIn URL format';
      return { clean: original, needsManual, reason };
    }
  }

  // Remove query params/fragments
  original = original.replace(/([?#]).*$/, '');

  return { clean: original, needsManual };
}

async function cleanLinkedInUrls() {
  const { data: alumni, error } = await supabase
    .from('alumni')
    .select('id, name, linkedin_url')
    .not('linkedin_url', 'is', null);

  if (error) {
    console.error('Error fetching alumni:', error);
    return;
  }
  if (!alumni || alumni.length === 0) {
    console.log('No alumni found with a linkedin_url.');
    return;
  }

  let updated = 0;
  let manual = 0;
  let unchanged = 0;
  const manualReview: { id: string, name: string, url: string, reason?: string }[] = [];

  for (const alum of alumni) {
    const url = alum.linkedin_url;
    if (!url) continue;
    const { clean, needsManual, reason } = normalizeLinkedInUrl(url);
    if (needsManual) {
      manual++;
      manualReview.push({ id: alum.id, name: alum.name, url, reason });
      continue;
    }
    if (clean !== url) {
      const { error: updateError } = await supabase
        .from('alumni')
        .update({ linkedin_url: clean })
        .eq('id', alum.id);
      if (updateError) {
        console.error(`Error updating alumni ${alum.id}:`, updateError);
      } else {
        console.log(`Updated ${alum.name || alum.id}: ${url} -> ${clean}`);
        updated++;
      }
    } else {
      unchanged++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Manual review: ${manual}, Unchanged: ${unchanged}`);
  if (manualReview.length > 0) {
    console.log('\nManual review needed for the following URLs:');
    manualReview.forEach(({ id, name, url, reason }) => {
      console.log(`- ${name || id}: ${url} (${reason})`);
    });
  }
}

cleanLinkedInUrls(); 