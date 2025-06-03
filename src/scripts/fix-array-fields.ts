import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Function to clean a single array value
function cleanArrayValue(value: string): string {
  // Remove outer quotes and brackets
  let cleaned = value.replace(/^\[?'|'\]?$/g, '');
  // Remove any remaining quotes
  cleaned = cleaned.replace(/^'|'$/g, '');
  // Trim whitespace
  return cleaned.trim();
}

// Function to clean an array of values
function cleanArray(arr: string[]): string[] {
  return arr.map(cleanArrayValue).filter(Boolean);
}

async function fixArrayFields() {
  try {
    // Fetch all records
    const { data: records, error: fetchError } = await supabase
      .from('alumni')
      .select('*');

    if (fetchError) throw fetchError;

    console.log(`Processing ${records.length} records...`);

    // Process each record
    for (const record of records) {
      const updates: any = {};

      // Clean phone_numbers array
      if (record.phone_numbers && Array.isArray(record.phone_numbers)) {
        updates.phone_numbers = cleanArray(record.phone_numbers);
      }

      // Clean email array
      if (record.email && Array.isArray(record.email)) {
        updates.email = cleanArray(record.email);
      }

      // Clean linkedin array
      if (record.linkedin && Array.isArray(record.linkedin)) {
        updates.linkedin = cleanArray(record.linkedin);
      }

      // Clean instagram array
      if (record.instagram && Array.isArray(record.instagram)) {
        updates.instagram = cleanArray(record.instagram);
      }

      // Clean facebook array
      if (record.facebook && Array.isArray(record.facebook)) {
        updates.facebook = cleanArray(record.facebook);
      }

      // Clean twitter array
      if (record.twitter && Array.isArray(record.twitter)) {
        updates.twitter = cleanArray(record.twitter);
      }

      // Clean other_social array
      if (record.other_social && Array.isArray(record.other_social)) {
        updates.other_social = cleanArray(record.other_social);
      }

      // Clean little_brothers array
      if (record.little_brothers && Array.isArray(record.little_brothers)) {
        updates.little_brothers = cleanArray(record.little_brothers);
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('alumni')
          .update(updates)
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          console.log(`Updated record ${record.id}`);
        }
      }
    }

    console.log('Array field cleanup completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the fix
fixArrayFields(); 