// scripts/scrape-linkedin.ts
import { LinkedInScraper } from '../src/lib/linkedin-scraper';
import { SupabaseLinkedInManager } from '../src/lib/supabase-integration';

async function runScraper() {
  console.log('🚀 Starting LinkedIn scraper...');
  
  const scraper = new LinkedInScraper();
  const dbManager = new SupabaseLinkedInManager();
  
  try {
    // Step 1: ALWAYS backup first
    console.log('📋 Creating backup...');
    await dbManager.backupAllAlumni();
    
    // Step 2: Initialize scraper
    console.log('🔧 Initializing browser...');
    await scraper.initialize();
    
    console.log('🔐 Logging into LinkedIn...');
    await scraper.loginToLinkedIn();
    
    // Step 3: Option A - Test with manual URLs
    const testUrls = [
      'https://www.linkedin.com/in/roy-lee-goat/', 
      //'https://www.linkedin.com/in/brenna-lonsdale-9717b3345/',
      //'https://www.linkedin.com/in/satyanadella/',
      // Add real LinkedIn profile URLs here for testing
    ];
    
    console.log(`🎯 Testing with ${testUrls.length} profiles...`);
    const results = await scraper.scrapeMultipleProfiles(testUrls);
    
    // Step 4: Save to JSON and database
    await scraper.saveToJson(results);
    await dbManager.processBatchScrapedData(results);
    
    console.log('✅ Scraping complete!');
    
    // Step 5: Option B - Scrape from existing database (uncomment when ready)
    /*
    console.log('🔍 Finding profiles that need scraping...');
    const unscrapedProfiles = await dbManager.getUnscrapedLinkedInProfiles();
    
    if (unscrapedProfiles.length > 0) {
      const urls = unscrapedProfiles
        .map(alumni => alumni.linkedin_url)
        .filter(Boolean) as string[];
      
      console.log(`📊 Found ${urls.length} profiles to scrape`);
      const results = await scraper.scrapeMultipleProfiles(urls.slice(0, 5)); // Start with just 5
      
      await scraper.saveToJson(results);
      await dbManager.processBatchScrapedData(results);
    } else {
      console.log('✅ No profiles need scraping!');
    }
    */
    
  } catch (error) {
    console.error('❌ Scraper failed:', error);
    console.log('💡 Check your .env.local file and LinkedIn credentials');
  } finally {
    await scraper.close();
    console.log('🏁 Browser closed');
  }
}

// Run the scraper
runScraper().catch(console.error); 