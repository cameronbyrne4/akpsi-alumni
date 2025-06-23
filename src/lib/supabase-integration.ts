// Supabase Integration for LinkedIn Scraper
import { supabase } from './supabase';
import { Alumni, CareerExperience } from './linkedin-scraper';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
const rootDir = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Enhanced Alumni type with better career_history structure
export type EnhancedAlumni = Omit<Alumni, 'career_history'> & {
  career_history?: CareerExperience[]; // Now properly typed as array of objects
};

class SupabaseLinkedInManager {
  
  // 1. Backup your current data before making changes
  async backupAllAlumni(): Promise<void> {
    try {
      console.log('🔄 Creating backup of current alumni data...');
      
      const { data, error } = await supabase
        .from('alumni')
        .select('*');

      if (error) throw error;

      // Create backups directory if it doesn't exist
      const backupDir = 'data/backups';
      await require('fs').promises.mkdir(backupDir, { recursive: true });

      // Save backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${backupDir}/alumni_backup_${timestamp}.json`;
      
      await require('fs').promises.writeFile(
        backupFilename, 
        JSON.stringify(data, null, 2)
      );
      
      console.log(`✅ Backup saved to: ${backupFilename}`);
      console.log(`📊 Backed up ${data?.length || 0} alumni records`);
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  // 2. Update your database schema to support better career_history
  async updateDatabaseSchema(): Promise<void> {
    console.log('📋 Database schema update recommendations:');
    console.log(`
    -- Run these SQL commands in your Supabase SQL editor:
    
    -- 1. Update career_history to JSONB for better structure
    ALTER TABLE alumni 
    ALTER COLUMN career_history TYPE JSONB 
    USING career_history::jsonb;
    
    -- 2. Add index for better performance on JSON queries
    CREATE INDEX IF NOT EXISTS idx_alumni_career_history 
    ON alumni USING GIN (career_history);
    
    -- 3. Add index on linkedin_url for faster lookups
    CREATE INDEX IF NOT EXISTS idx_alumni_linkedin_url 
    ON alumni (linkedin_url);
    
    -- 4. Add constraint to ensure linkedin_url is unique when not null
    ALTER TABLE alumni 
    ADD CONSTRAINT unique_linkedin_url 
    UNIQUE (linkedin_url);
    `);
  }

  // 3. Insert or update alumni data from scraper
  async upsertAlumni(alumniData: Partial<EnhancedAlumni>): Promise<void> {
    try {
      // Check if alumni already exists by linkedin_url
      let existingAlumni = null;
      
      if (alumniData.linkedin_url) {
        const { data } = await supabase
          .from('alumni')
          .select('*')
          .eq('linkedin_url', alumniData.linkedin_url)
          .single();
        
        existingAlumni = data;
      }

      if (existingAlumni) {
        // Update existing record
        const { error } = await supabase
          .from('alumni')
          .update({
            ...alumniData,
            scraped: true,
            manually_verified: false, // Reset since we have new scraped data
            // Keep existing fields that we don't scrape
            big_brother: existingAlumni.big_brother,
            little_brothers: existingAlumni.little_brothers,
            family_branch: existingAlumni.family_branch,
            source_sheet: existingAlumni.source_sheet,
            emails: existingAlumni.emails,
            phones: existingAlumni.phones,
            minors: existingAlumni.minors
          })
          .eq('id', existingAlumni.id);

        if (error) throw error;
        console.log(`✅ Updated existing alumni: ${alumniData.name}`);
        
      } else {
        // Insert new record
        const { error } = await supabase
          .from('alumni')
          .insert([{
            ...alumniData,
            id: crypto.randomUUID(), // Generate new ID
            scraped: true,
            manually_verified: false
          }]);

        if (error) throw error;
        console.log(`✅ Inserted new alumni: ${alumniData.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to upsert alumni ${alumniData.name}:`, error);
      throw error;
    }
  }

  // 4. Batch process scraped data
  async processBatchScrapedData(scrapedData: Partial<EnhancedAlumni>[]): Promise<void> {
    console.log(`\n🔄 Processing ${scrapedData.length} scraped profiles...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const alumni of scrapedData) {
      try {
        if (alumni.scraped) {
          await this.upsertAlumni(alumni);
          successCount++;
        } else {
          // Log failed scrapes
          console.log(`⚠️ Skipping failed scrape: ${alumni.linkedin_url}`);
          failCount++;
        }
        
        // Small delay between database operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Database error for ${alumni.name}:`, error);
        failCount++;
      }
    }

    console.log(`\n📊 Batch processing complete:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
  }

  // 5. Query functions for your scraped data
  async getAlumniByCompany(company: string): Promise<EnhancedAlumni[]> {
    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .contains('companies', [company]);

    if (error) throw error;
    return data || [];
  }

  async getAlumniByGraduationYear(year: number): Promise<EnhancedAlumni[]> {
    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .eq('graduation_year', year);

    if (error) throw error;
    return data || [];
  }

  async getUnscrapedLinkedInProfiles(): Promise<EnhancedAlumni[]> {
    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .eq('has_linkedin', true)
      .eq('scraped', false)
      .not('linkedin_url', 'is', null);

    if (error) throw error;
    return data || [];
  }

  // 6. Restore from backup if needed
  async restoreFromBackup(backupFilename: string): Promise<void> {
    try {
      console.log(`🔄 Restoring from backup: ${backupFilename}`);
      
      // Ensure the backup file exists in the backups directory
      const backupPath = backupFilename.startsWith('data/backups/') 
        ? backupFilename 
        : `data/backups/${backupFilename}`;

      const backupData = JSON.parse(
        await require('fs').promises.readFile(backupPath, 'utf8')
      );

      // Clear current data (be very careful!)
      console.log('⚠️ This will DELETE all current alumni data. Are you sure?');
      // Uncomment the next lines only if you're absolutely sure:
      // const { error: deleteError } = await supabase
      //   .from('alumni')
      //   .delete()
      //   .neq('id', '');
      
      // if (deleteError) throw deleteError;

      // Insert backup data
      const { error } = await supabase
        .from('alumni')
        .insert(backupData);

      if (error) throw error;
      
      console.log(`✅ Restored ${backupData.length} records from backup`);
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }
}

// Updated main function that integrates with Supabase
async function mainWithSupabase() {
  const scraper = new (await import('./linkedin-scraper')).LinkedInScraper();
  const dbManager = new SupabaseLinkedInManager();
  
  try {
    // 1. Always backup first!
    await dbManager.backupAllAlumni();
    
    // 2. Initialize scraper
    console.log('🚀 Initializing LinkedIn scraper...');
    await scraper.initialize();
    await scraper.loginToLinkedIn();
    
    // 3. Get profiles that need scraping
    const unscrapedProfiles = await dbManager.getUnscrapedLinkedInProfiles();
    console.log(`📋 Found ${unscrapedProfiles.length} profiles to scrape`);
    
    if (unscrapedProfiles.length === 0) {
      console.log('✅ No profiles need scraping!');
      return;
    }

    // 4. Extract URLs and scrape
    const urlsToScrape = unscrapedProfiles
      .map(alumni => alumni.linkedin_url)
      .filter(Boolean) as string[];
    
    console.log(`🔍 Scraping ${urlsToScrape.length} LinkedIn profiles...`);
    const scrapedData = await scraper.scrapeMultipleProfiles(urlsToScrape);
    
    // 5. Save to JSON backup AND database
    await scraper.saveToJson(scrapedData); // JSON backup
    await dbManager.processBatchScrapedData(scrapedData); // Database
    
    console.log('🎉 All done! Check your Supabase dashboard for updated data.');
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    console.log('💡 Your backup is safe and can be restored if needed.');
  } finally {
    await scraper.close();
  }
}

export { SupabaseLinkedInManager, mainWithSupabase };