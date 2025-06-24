// LinkedIn Profile Scraper - Complete Fixed Version
// WARNING: This violates LinkedIn's Terms of Service. Use at your own risk.
// Never use your primary LinkedIn account for scraping.

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import fs from 'fs/promises';
import * as dotenv from 'dotenv';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

dotenv.config({ path: '.env.local' });

// Configuration object for all selectors - easy to maintain when LinkedIn changes
const SELECTORS = {
  profile: {
    name: [
      'h1.njcBdvQBYQZqUIpKOqGBLuXfBVeHoqmK',
      'h1.inline.t-24.v-align-middle.break-words',
      'h1[data-generated-suggestion-target]'
    ],
    headline: [
      '.text-body-medium.break-words',
      '[data-generated-suggestion-target] + div',
      '.t-14.t-normal'
    ],
    location: [
      '.text-body-small.v-align-middle.break-words.t-black--light',
      '.t-14.t-normal.t-black--light'
    ],
    pictureUrl: [
      'img.ivm-view-attr__img--centered',
      'img.EntityPhoto-square-3',
      '[data-anonymize="headshot"] img'
    ],
    about: [
      '.inline-show-more-text--is-collapsed',
      '.pv-shared-text-with-see-more .inline-show-more-text',
      '.GyvtKdWUXEilnzOffxRztjYolPsgWrtkmemg'
    ]
  },
  experience: {
    container: [
      '.artdeco-list__item.ZKjxFcDBtjvyNtGCjCRedDBgOGzQcIBfRhpvSKrI',
      '.QtoUeagDawdshVqpeDdUSsPDXjpepavEQc',
      '.pvs-entity__summary-info'
    ],
    role: [
      '.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
      '.display-flex.align-items-center.mr1.hoverable-link-text.t-bold',
      '.t-16.t-black.t-bold'
    ],
    company: [
      '.t-14.t-normal span[aria-hidden="true"]',
      '.t-14.t-normal',
      '.pv-entity__secondary-title'
    ],
    duration: [
      '.pvs-entity__caption-wrapper',
      '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
      '.pv-entity__dates'
    ],
    location: [
      '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
      '.t-14.t-normal.t-black--light',
      '.pv-entity__location'
    ],
    description: [
      '.inline-show-more-text--is-collapsed span[aria-hidden="true"]',
      '.GyvtKdWUXEilnzOffxRztjYolPsgWrtkmemg',
      '.pvs-list__item--with-top-padding .t-14'
    ]
  },
  education: {
    container: [
      '.artdeco-list__item.ZKjxFcDBtjvyNtGCjCRedDBgOGzQcIBfRhpvSKrI',
      '.QtoUeagDawdshVqpeDdUSsPDXjpepavEQc',
      '.pvs-entity__summary-info'
    ],
    school: [
      '.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
      '.display-flex.align-items-center.mr1.hoverable-link-text.t-bold',
      '.pv-entity__school-name'
    ],
    degree: [
      '.t-14.t-normal span[aria-hidden="true"]',
      '.t-14.t-normal',
      '.pv-entity__degree-name'
    ],
    years: [
      '.pvs-entity__caption-wrapper',
      '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
      '.pv-entity__dates'
    ]
  },
  loginCheck: [
    '#global-nav-typeahead',
    '.global-nav__me',
    '[data-control-name="nav.settings_and_privacy"]'
  ]
};

// Alumni type matching your database structure
export type Alumni = {
  id: string;
  name: string;
  linkedin_url?: string;
  picture_url?: string;
  bio?: string;
  role?: string;
  companies?: string[];
  big_brother?: string;
  little_brothers?: string[];
  family_branch?: string;
  graduation_year?: number;
  location?: string;
  has_linkedin: boolean;
  scraped: boolean;
  manually_verified: boolean;
  source_sheet?: string[];
  created_at?: string;
  emails?: string[];
  phones?: string[];
  majors?: string[];
  minors?: string[];
  career_history?: CareerExperience[];
};

export type CareerExperience = {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  description?: string;
};

class LinkedInScraper {
  private browser: Browser | null;
  private page: Page | null;

  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      slowMo: 50, // Reduced from 100 since stealth plugin handles timing
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1366,768'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set realistic viewport (stealth plugin handles user agent rotation)
    await this.page.setViewport({ 
      width: 1366,
      height: 768
    });

    // Additional stealth measures on top of the plugin
    await this.page.evaluateOnNewDocument(() => {
      // Override the plugin property to make it even stealthier
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          }
        ],
      });
      
      // Mock realistic screen properties
      Object.defineProperty(screen, 'availHeight', {get: () => 1040});
      Object.defineProperty(screen, 'availWidth', {get: () => 1920});
      Object.defineProperty(screen, 'colorDepth', {get: () => 24});
    });

    console.log('🥷 Stealth mode activated - enhanced bot detection evasion');
  }

  async loginToLinkedIn(): Promise<void> {
    const email = process.env.LINKEDIN_EMAIL;
    const password = process.env.LINKEDIN_PASSWORD;

    if (!email || !password) {
      throw new Error('Missing LinkedIn credentials. Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in your .env.local file.');
    }

    try {
      console.log('🔐 Navigating to LinkedIn login...');
      await this.page!.goto('https://www.linkedin.com/login', { 
        waitUntil: 'domcontentloaded',  // Only wait for initial HTML
        timeout: 30000
      });

      // Wait for login form to load
      await this.page!.waitForSelector('#username', { timeout: 10000 });

      // More human-like typing with realistic delays
      await this.humanDelay(500, 1000);
      await this.page!.click('#username');
      await this.humanDelay(100, 200);
      
      // Type email with human-like variations in speed
      for (const char of email) {
        await this.page!.type('#username', char, { delay: 30 + Math.random() * 50 });
      }

      await this.humanDelay(300, 500);
      await this.page!.click('#password');
      await this.humanDelay(100, 200);
      
      // Type password with human-like variations
      for (const char of password) {
        await this.page!.type('#password', char, { delay: 40 + Math.random() * 80 });
      }

      await this.humanDelay(500, 1000);
      console.log('Submitting email and password...')
      
      // Click login button and wait for either success or failure
      await Promise.all([
        this.page!.click('button[type="submit"]'),
        // Wait for either the feed to load (success) or error messages (failure)
        Promise.race([
          this.page!.waitForSelector('div.feed-identity-module', { timeout: 45000 }), // Feed element
          this.page!.waitForSelector('#error-for-username, #error-for-password', { timeout: 45000 }) // Error elements
        ])
      ]);

      console.log('Navigated to feed page'); 

      // Check if we got an error
      const errorElement = await this.page!.$('#error-for-username, #error-for-password');
      if (errorElement) {
        const errorText = await this.page!.evaluate(el => el.textContent, errorElement);
        throw new Error(`Login error: ${errorText}`);
      }

      // Verify login success by checking for elements that only exist when logged in
      let loginSuccess = false;
      for (const selector of SELECTORS.loginCheck) {
        try {
          await this.page!.waitForSelector(selector, { timeout: 10000 });
          loginSuccess = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!loginSuccess) {
        // Take screenshot for debugging
        await this.page!.screenshot({ path: 'login_error.png', fullPage: true });
        throw new Error('Login verification failed. Check login_error.png for details. CAPTCHA or 2FA might be required.');
      }

      console.log('✅ Successfully logged in to LinkedIn');
      await this.humanDelay(2000, 4000);
      
    } catch (error) {
      await this.page!.screenshot({ path: 'login_error.png', fullPage: true });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Login failed: ${errorMessage}`);
    }
  }

  async checkIfBlocked(): Promise<boolean> {
    const currentUrl = this.page!.url();
    const title = await this.page!.title();
    
    const blockIndicators = [
      'authwall',
      'checkpoint',
      'challenge',
      'security',
      'verify',
      'captcha'
    ];
    
    const isBlocked = blockIndicators.some(indicator => 
      currentUrl.toLowerCase().includes(indicator) || 
      title.toLowerCase().includes(indicator)
    );
    
    if (isBlocked) {
      console.log('🚨 Detected potential block. Taking screenshot...');
      await this.page!.screenshot({ 
        path: `blocked_${Date.now()}.png`,
        fullPage: true 
      });
    }
    
    return isBlocked;
  }

  async navigateWithRetry(url: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Navigation attempt ${attempt}/${maxRetries} for: ${url}`);
        
        // Add random delay between attempts
        if (attempt > 1) {
          const delay = 5000 + (attempt * 2000) + Math.random() * 3000;
          console.log(`⏳ Waiting ${(delay/1000).toFixed(1)}s before retry...`);
          await this.humanDelay(delay);
        }
        
        const response = await this.page!.goto(url, {
          waitUntil: 'domcontentloaded',  // Only wait for initial HTML
          timeout: 60000
        });
        
        // Wait for profile content to be visible
        await this.page!.waitForSelector('main, [data-test-id], .scaffold-layout__content', {
          timeout: 30000
        });
        
        if (await this.checkIfBlocked()) {
          throw new Error('Account appears to be blocked or rate limited');
        }
        
        if (response && response.status() === 200) {
          console.log(`✅ Successfully navigated to: ${url}`);
          return true;
        }
        
      } catch (error: any) {
        console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    return false;
  }

  async scrapeProfile(linkedinUrl: string): Promise<Partial<Alumni>> {
    try {
      console.log(`Scraping profile: ${linkedinUrl}`);
      
      // Navigate with retry logic
      const navigated = await this.navigateWithRetry(linkedinUrl, 2); // ERROR HERE
      if (!navigated) {
        throw new Error('Failed to navigate after retries');
      }

      console.log('Checkpoint: Nav done, now checking if we got blocked or redirected');

      // Check if we got blocked or redirected
      const currentUrl = this.page!.url();
      
      if (currentUrl.includes('linkedin.com/authwall') || 
          currentUrl.includes('linkedin.com/checkpoint') ||
          currentUrl.includes('linkedin.com/signup')) {
        throw new Error('Hit LinkedIn auth wall or checkpoint - account may be flagged');
      }

      // Add longer wait for profile to load
      await this.humanDelay(3000, 6000);
      console.log('Checkpoint: Nav done, now waiting for profile indicator');

      // Try to wait for any profile indicator
      try {
        await this.page!.waitForSelector('main, [data-test-id], .scaffold-layout__content', { 
          timeout: 15000 
        });
      } catch (e) {
        // Take screenshot for debugging
        await this.page!.screenshot({ 
          path: `profile_load_error_${Date.now()}.png`,
          fullPage: true 
        });
        throw new Error('Profile content did not load - see screenshot for details');
      }
      console.log('Checkpoint: scrolling around a bit');

      // Simulate human behavior - scroll slowly
      await this.page!.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight / 2){
              clearInterval(timer);
              resolve(void 0);
            }
          }, 200);
        });
      });

      await this.humanDelay(2000, 4000);
      console.log('Checkpoint: gathering profile data');
      
      // Set up console listener to show in terminal
      this.page!.on('console', msg => {
        console.log('Browser:', msg.text());
      });
      
      const profileData = await this.page!.evaluate((selectors) => {
        console.log('Starting profile data extraction...');
        console.log('Available selectors:', JSON.stringify(selectors, null, 2));
        
        // Helper function to try multiple selectors
        const trySelectors = (selectorArray: string[]): string => {
          console.log('Trying selectors:', selectorArray);
          for (const selector of selectorArray) {
            const element = document.querySelector(selector);
            console.log(`Selector "${selector}":`, element ? 'Found' : 'Not found');
            if (element?.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          return '';
        };

        const trySelectorsForAttribute = (selectorArray: string[], attribute: string): string => {
          console.log(`Trying selectors for attribute "${attribute}":`, selectorArray);
          for (const selector of selectorArray) {
            const element = document.querySelector(selector);
            console.log(`Selector "${selector}":`, element ? 'Found' : 'Not found');
            if (element?.getAttribute(attribute)) {
              return element.getAttribute(attribute) || '';
            }
          }
          return '';
        };

        // Debug: Log the entire document structure
        console.log('Document structure:', document.documentElement.outerHTML.slice(0, 1000) + '...');

        // Extract basic profile information using fallback selectors
        console.log('\nExtracting basic profile info...');
        const name = trySelectors(selectors.profile.name);
        console.log('Found name:', name);
        
        const headline = trySelectors(selectors.profile.headline);
        console.log('Found headline:', headline);
        
        const location = trySelectors(selectors.profile.location);
        console.log('Found location:', location);
        
        const pictureUrl = trySelectorsForAttribute(selectors.profile.pictureUrl, 'src');
        console.log('Found picture URL:', pictureUrl);
        
        const about = trySelectors(selectors.profile.about);
        console.log('Found about section:', about ? 'Yes' : 'No');

        // Extract experiences with multiple fallback strategies
        console.log('\nExtracting work experience...');
        const experiences: Array<{
          role: string;
          company: string;
          duration?: string;
          location?: string;
          description?: string;
        }> = [];
        
        // Try each experience container selector
        for (const containerSelector of selectors.experience.container) {
          console.log(`\nTrying experience container selector: ${containerSelector}`);
          const elements = document.querySelectorAll(containerSelector);
          console.log(`Found ${elements.length} experience elements`);
          
          if (elements.length > 0) {
            // Log the first experience element's structure
            console.log('First experience element structure:', elements[0].outerHTML.slice(0, 500) + '...');
            
            elements.forEach((exp, index) => {
              console.log(`\nProcessing experience ${index + 1}...`);
              console.log('Experience element structure:', exp.outerHTML.slice(0, 500) + '...');
              
              // Use the exp element as the context for these selectors
              const role = trySelectors(selectors.experience.role.map(selector => 
                exp.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Role: ${role}`);
              
              const company = trySelectors(selectors.experience.company.map(selector => 
                exp.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Company: ${company}`);
              
              const duration = trySelectors(selectors.experience.duration.map(selector => 
                exp.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Duration: ${duration}`);
              
              const location = trySelectors(selectors.experience.location.map(selector => 
                exp.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Location: ${location}`);
              
              const description = trySelectors(selectors.experience.description.map(selector => 
                exp.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Description: ${description ? 'Found' : 'Not found'}`);

              if (role && company) {
                experiences.push({
                  role,
                  company: company.replace(/^Company Name\s*·?\s*/, '').replace(/\s*·\s*Full-time|\s*·\s*Part-time/, '').trim(),
                  duration,
                  location,
                  description
                });
                console.log('✓ Experience added');
              } else {
                console.log('✗ Skipping experience - missing role or company');
              }
            });
            break; // Stop if we found experiences
          }
        }

        // Extract education and graduation info
        console.log('\nExtracting education info...');
        let graduationYear: number | undefined = undefined;
        const majors: string[] = [];
        
        // Try each education container selector
        for (const containerSelector of selectors.education.container) {
          console.log(`\nTrying education container selector: ${containerSelector}`);
          const elements = document.querySelectorAll(containerSelector);
          console.log(`Found ${elements.length} education elements`);
          
          if (elements.length > 0) {
            // Log the first education element's structure
            console.log('First education element structure:', elements[0].outerHTML.slice(0, 500) + '...');
            
            elements.forEach((edu, index) => {
              console.log(`\nProcessing education ${index + 1}...`);
              console.log('Education element structure:', edu.outerHTML.slice(0, 500) + '...');
              
              // Use the edu element as the context for these selectors
              const school = trySelectors(selectors.education.school.map(selector => 
                edu.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- School: ${school}`);
              
              const degree = trySelectors(selectors.education.degree.map(selector => 
                edu.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Degree: ${degree}`);
              
              const years = trySelectors(selectors.education.years.map(selector => 
                edu.querySelector(selector)?.textContent?.trim() || ''
              ).filter(Boolean));
              console.log(`- Years: ${years}`);

              // Extract graduation year
              const yearMatch = years.match(/(\d{4})/g);
              if (yearMatch) {
                const latestYear = Math.max(...yearMatch.map(Number));
                if (!graduationYear || latestYear > graduationYear) {
                  graduationYear = latestYear;
                  console.log(`- Found graduation year: ${graduationYear}`);
                }
              }

              // Extract major from degree
              if (degree && !degree.toLowerCase().includes('university') && !degree.toLowerCase().includes('college')) {
                majors.push(degree);
                console.log(`- Added major: ${degree}`);
              }
            });
            break; // Stop if we found education
          }
        }

        console.log('\nProfile data extraction complete!');
        return {
          name,
          headline,
          location,
          pictureUrl,
          about,
          experiences,
          graduationYear,
          majors: majors.filter(Boolean),
          currentRole: experiences[0]?.role || '',
          currentCompany: experiences[0]?.company || ''
        };
      }, SELECTORS);

      // Structure data according to Alumni type
      const alumniData: Partial<Alumni> = {
        name: profileData.name,
        linkedin_url: linkedinUrl,
        picture_url: profileData.pictureUrl,
        bio: profileData.about,
        role: profileData.currentRole,
        location: profileData.location,
        has_linkedin: true,
        scraped: true,
        manually_verified: false,
        career_history: profileData.experiences,
        companies: profileData.experiences.map((exp: any) => exp.company).filter(Boolean),
        graduation_year: profileData.graduationYear,
        majors: profileData.majors,
        created_at: new Date().toISOString()
      };

      console.log(`Successfully scraped: ${profileData.name}`);
      return alumniData;

    } catch (error: any) {
      console.error(`Failed to scrape ${linkedinUrl}:`, error.message);
      
      // Take screenshot for debugging
      await this.page!.screenshot({ 
        path: `error_${Date.now()}.png`,
        fullPage: true 
      });
      
      throw error;
    }
  }

  async scrapeMultipleProfiles(urls: string[]): Promise<Partial<Alumni>[]> {
    const results: Partial<Alumni>[] = [];
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        console.log(`\n[${i + 1}/${urls.length}] Processing: ${url}`);
        
        // Check if we've had too many consecutive failures
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log('🛑 Too many consecutive failures. Stopping to prevent account flag.');
          break;
        }
        
        const profileData = await this.scrapeProfile(url); // ERRORS HERE
        results.push(profileData);
        consecutiveFailures = 0; // Reset on success
        
        // Variable delay with longer waits
        const delay = 8000 + Math.random() * 12000; // 8-20 seconds
        console.log(`✅ Success! Waiting ${(delay/1000).toFixed(1)}s before next profile...`);
        await this.humanDelay(delay);
        
      } catch (error: any) {
        console.error(`✗ Failed to scrape ${url}:`, error.message);
        consecutiveFailures++;
        
        results.push({
          linkedin_url: url,
          has_linkedin: true,
          scraped: false,
          manually_verified: false,
          created_at: new Date().toISOString()
        });
        
        // Longer delay on errors, increasing with consecutive failures
        const errorDelay = 15000 + (consecutiveFailures * 5000);
        console.log(`⏳ Waiting ${(errorDelay/1000).toFixed(1)}s due to error...`);
        await this.humanDelay(errorDelay);
      }
    }
    
    return results;
  }

  async saveToJson(data: Partial<Alumni>[], filename: string = `linkedin_profiles_${Date.now()}.json`) {
    try {
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`\n✓ Data saved to ${filename}`);
      console.log(`✓ Successfully scraped ${data.filter(d => d.scraped).length}/${data.length} profiles`);
    } catch (error) {
      console.error('Error saving to JSON:', error);
    }
  }

  private humanDelay(min: number = 1000, max?: number): Promise<void> {
    const delay = max ? min + Math.random() * (max - min) : min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Usage example with proper error handling
async function main() {
  const scraper = new LinkedInScraper();
  
  try {
    console.log('🚀 Initializing LinkedIn scraper...');
    await scraper.initialize();
    
    console.log('🔐 Logging in to LinkedIn...');
    await scraper.loginToLinkedIn();
    
    // Example URLs - replace with actual LinkedIn profile URLs
    const profileUrls = [
      'https://www.linkedin.com/in/satyanadella/', // Microsoft CEO - public profile
      'https://www.linkedin.com/in/jeffweiner08/', // Well-known exec
      // Add more URLs here
    ];

    if (profileUrls.length === 1) {
      // Single profile
      const result = await scraper.scrapeProfile(profileUrls[0]);
      console.log('\n📋 Profile Data:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Multiple profiles
      console.log(`\n📊 Starting batch scrape of ${profileUrls.length} profiles...`);
      const results = await scraper.scrapeMultipleProfiles(profileUrls);
      await scraper.saveToJson(results);
    }
    
  } catch (error: any) {
    console.error('❌ Scraping failed:', error.message);
    console.error('💡 Tips:');
    console.error('  - Check your .env.local file has LINKEDIN_EMAIL and LINKEDIN_PASSWORD');
    console.error('  - Verify the LinkedIn URLs are correct');
    console.error('  - LinkedIn may have presented a CAPTCHA');
  } finally {
    await scraper.close();
    console.log('🏁 Scraper closed');
  }
}

export { LinkedInScraper };

// Auto-run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}