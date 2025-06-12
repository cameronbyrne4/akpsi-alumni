from linkedin_scraper import Person, actions
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import os
from datetime import datetime
import time
import json
import re
import random
from supabase import create_client, Client
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL', ''),
    os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
)

def sanitize_filename(name):
    # Remove invalid characters from filename
    return re.sub(r'[<>:"/\\|?*]', '', name)

def clean_text(text):
    if not text:
        return None
    
    # Split by newlines
    lines = text.split('\n')
    
    # Clean and deduplicate lines
    seen = set()
    unique_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Skip if this line is a duplicate
        if line in seen:
            continue
            
        # Skip if this line is a duplicate with different date format
        # (e.g., "Sep 2024 - Nov 2024 · 3 mos" vs "Sep 2024 to Nov 2024 · 3 mos")
        is_duplicate_date = False
        if '·' in line and any(char in line for char in ['-', 'to']):
            # Extract the date part and duration
            parts = line.split('·')
            if len(parts) == 2:
                date_part = parts[0].strip()
                duration = parts[1].strip()
                # Check if we've seen a similar date with different format
                for seen_line in seen:
                    if '·' in seen_line and duration in seen_line:
                        is_duplicate_date = True
                        break
        
        if not is_duplicate_date:
            seen.add(line)
            unique_lines.append(line)
    
    return '\n'.join(unique_lines)

def clean_company_name(company):
    # Remove employment type (e.g., "· Full-time", "· Part-time")
    return re.sub(r'\s*·\s*(Full-time|Part-time|Contract|Internship|Self-employed|Freelance)$', '', company)

def random_human_delay(min_sec=2, max_sec=5):
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)

def random_human_scroll_and_mouse(driver):
    # Random scroll
    scroll_height = driver.execute_script("return document.body.scrollHeight")
    for _ in range(random.randint(2, 5)):
        scroll_to = random.randint(0, scroll_height)
        driver.execute_script(f"window.scrollTo(0, {scroll_to});")
        time.sleep(random.uniform(0.5, 1.5))
    # Random mouse movement
    try:
        action = ActionChains(driver)
        for _ in range(random.randint(2, 5)):
            x = random.randint(0, 800)
            y = random.randint(0, 600)
            action.move_by_offset(x, y).perform()
            time.sleep(random.uniform(0.2, 0.7))
            action.move_by_offset(-x, -y).perform()
    except Exception:
        pass

def clean_linkedin_url(url: str) -> str:
    """Clean and format LinkedIn URL."""
    if not url:
        return None
    
    # Remove any leading/trailing whitespace
    url = url.strip()
    
    # If it's just a username, add the full URL
    if url.startswith('/'):
        url = url[1:]  # Remove leading slash
    if not url.startswith('http'):
        url = f"https://www.linkedin.com/in/{url}"
    
    # Remove trailing slash if present
    if url.endswith('/'):
        url = url[:-1]
    
    return url

def get_unscraped_profiles() -> list:
    """Fetch unscraped LinkedIn profiles from Supabase."""
    try:
        # Fix the query syntax
        response = supabase.table('alumni') \
            .select('id, name, linkedin_url') \
            .eq('scraped', False) \
            .not_.is_('linkedin_url', 'null') \
            .execute()
        
        # The response data is directly in response.data
        profiles = response.data
        print(f"\nFound {len(profiles)} unscraped profiles with LinkedIn URLs")
        
        # Clean and validate URLs
        valid_profiles = []
        for profile in profiles:
            if profile['linkedin_url']:
                clean_url = clean_linkedin_url(profile['linkedin_url'])
                if clean_url:
                    valid_profiles.append({
                        'id': profile['id'],
                        'name': profile['name'],
                        'linkedin_url': clean_url
                    })
        
        print(f"Valid LinkedIn URLs: {len(valid_profiles)}")
        return valid_profiles
        
    except Exception as e:
        print(f"Error in get_unscraped_profiles: {e}")
        print("Full response:", response)  # Add this to see what we're getting
        return []

# Claude function for putting info back into Supabase:
def save_profile_to_supabase(profile_id: str, person, linkedin_url: str):
    """Save scraped profile data to Supabase."""
    try:
        # Prepare companies array
        companies = [clean_company_name(exp.institution_name) for exp in person.experiences]
        
        # Get current location from most recent experience
        current_location = None
        for experience in person.experiences:
            location = getattr(experience, 'location', None)
            if location:
                current_location = location
                break
        
        # Prepare career history JSON
        career_history = {
            "bio": clean_text(person.about),
            "picture_url": person.picture if hasattr(person, 'picture') else None,
            "experiences": []
        }
        
        # Process experiences for career_history
        for experience in person.experiences:
            experience_data = {
                "position": experience.position_title,
                "company": clean_company_name(experience.institution_name),
                "location": getattr(experience, 'location', None),
                "duration": f"{experience.from_date} - Present" if not experience.to_date else f"{experience.from_date} to {experience.to_date}",
                "description": clean_text(experience.description) if experience.description else None
            }
            career_history["experiences"].append(experience_data)
        
        # Update the alumni record
        update_data = {
            'role': person.job_title,
            'companies': companies,
            'location': current_location,
            'has_linkedin': True,
            'scraped': True,
            'manually_verified': False,
            'career_history': career_history
        }
        
        response = supabase.table('alumni').update(update_data).eq('id', profile_id).execute()
        print(f"✅ Successfully saved {person.name} to database")
        return True
        
    except Exception as e:
        print(f"❌ Error saving to database: {e}")
        return False

def update_scraped_status_only(profile_id: str, success: bool = True):
    """Update only the scraped status in case of errors."""
    try:
        supabase.table('alumni').update({
            'scraped': success,
            'manually_verified': False
        }).eq('id', profile_id).execute()
    except Exception as e:
        print(f"Error updating scraped status for {profile_id}: {e}")

def save_cookies(driver, filename="linkedin_cookies.json"):
    """Save cookies to a file."""
    cookies = driver.get_cookies()
    with open(filename, 'w') as f:
        json.dump(cookies, f)
    print(f"Cookies saved to {filename}")

def load_cookies(driver, filename="linkedin_cookies.json"):
    """Load cookies from a file."""
    try:
        with open(filename, 'r') as f:
            cookies = json.load(f)
        for cookie in cookies:
            try:
                driver.add_cookie(cookie)
            except Exception as e:
                print(f"Error adding cookie: {e}")
        print("Cookies loaded successfully")
        return True
    except FileNotFoundError:
        print("No cookie file found")
        return False
    except Exception as e:
        print(f"Error loading cookies: {e}")
        return False

def main():
    email = os.getenv('LINKEDIN_EMAIL')
    password = os.getenv('LINKEDIN_PASSWORD')
    if not email or not password:
        print("Please set LINKEDIN_EMAIL and LINKEDIN_PASSWORD environment variables")
        return

    # Get unscraped profiles from database
    profiles = get_unscraped_profiles()
    if not profiles:
        print("No unscraped profiles found!")
        return

    # Show profiles for review
    print("\nProfiles to be scraped:")
    for i, profile in enumerate(profiles, 1):
        print(f"{i}. {profile['name']} - {profile['linkedin_url']}")
    
    # Ask for confirmation
    response = input("\nDo you want to proceed with scraping these profiles? (y/n): ")
    if response.lower() != 'y':
        print("Scraping cancelled.")
        return

    # Initialize Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-notifications")
    
    # Store all scraped data
    all_scraped_data = []
    output_file = None  # Initialize output_file
    
    # Process in batches of 10
    BATCH_SIZE = 10
    
    # Single browser session for all profiles
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(300)  # 5 minute timeout for page loads
        
        # Try to load existing cookies first
        driver.get("https://www.linkedin.com")
        time.sleep(2)
        
        if not load_cookies(driver):
            # If no cookies exist, login normally
            print("Logging in to LinkedIn...")
            actions.login(driver, email, password)
            time.sleep(random.uniform(3, 5))
            # Save cookies after successful login
            save_cookies(driver)
        else:
            # Refresh page to apply cookies
            driver.refresh()
            time.sleep(3)
        
        # Process profiles in batches
        for i in range(0, len(profiles), BATCH_SIZE):
            batch = profiles[i:i + BATCH_SIZE]
            print(f"\nProcessing batch {i//BATCH_SIZE + 1} of {(len(profiles) + BATCH_SIZE - 1)//BATCH_SIZE}")
            
            # Process each profile in the batch
            for profile in batch:
                try:
                    print(f"\nScraping {profile['name']}...")
                    
                    # Check if browser is still responsive
                    try:
                        driver.current_url
                    except Exception as e:
                        print("Browser session lost, attempting to recover...")
                        if driver:
                            driver.quit()
                        driver = webdriver.Chrome(options=chrome_options)
                        driver.set_page_load_timeout(300)  # 5 minute timeout
                        driver.get("https://www.linkedin.com")
                        time.sleep(2)
                        if not load_cookies(driver):
                            print("Logging in again...")
                            actions.login(driver, email, password)
                            time.sleep(random.uniform(3, 5))
                            save_cookies(driver)
                        else:
                            driver.refresh()
                            time.sleep(3)
                    
                    driver.get(profile['linkedin_url'])
                    time.sleep(random.uniform(3, 5))
                    
                    # Check for CAPTCHA
                    if "checkpoint" in driver.current_url or "challenge" in driver.current_url:
                        print("\n⚠️ CAPTCHA detected! Please solve it manually.")
                        print("The script will automatically continue once the CAPTCHA is solved...")
                        
                        # Wait for CAPTCHA to be solved (URL will change)
                        while "checkpoint" in driver.current_url or "challenge" in driver.current_url:
                            time.sleep(2)  # Check every 2 seconds
                        
                        print("CAPTCHA solved! Continuing with scraping...")
                        # Save cookies after solving CAPTCHA
                        save_cookies(driver)
                        time.sleep(2)  # Give a moment for the page to load after CAPTCHA
                    
                    # Random human-like behavior
                    random_human_scroll_and_mouse(driver)
                    
                    # Claude function number 2 - Scrape profile 
                    person = Person(profile['linkedin_url'], driver=driver)

                    # Save to Supabase
                    if save_profile_to_supabase(profile['id'], person, profile['linkedin_url']):
                        print(f"✅ Successfully scraped and saved {profile['name']}")
                    else:
                        print(f"⚠️ Scraped {profile['name']} but failed to save to database")
                        # Still mark as scraped even if database save failed
                        update_scraped_status_only(profile['id'], True)

                    # Keep backup JSON data
                    alumni_data = {
                        "id": profile['id'],
                        "name": person.name,
                        "linkedin_url": profile['linkedin_url'],
                        "picture_url": person.picture if hasattr(person, 'picture') else None,
                        "bio": clean_text(person.about),
                        "role": person.job_title,
                        "companies": [clean_company_name(exp.institution_name) for exp in person.experiences],
                        "current_location": None,
                        "has_linkedin": True,
                        "scraped": True,
                        "manually_verified": False,
                        "created_at": datetime.now().isoformat(),
                        "experiences": []
                    }

                    # Process experiences for JSON backup
                    for experience in person.experiences:
                        location = getattr(experience, 'location', None)
                        if not alumni_data["current_location"] and location:
                            alumni_data["current_location"] = location
                        experience_data = {
                            "position": experience.position_title,
                            "company": clean_company_name(experience.institution_name),
                            "location": location,
                            "duration": f"{experience.from_date} - Present" if not experience.to_date else f"{experience.from_date} to {experience.to_date}",
                            "description": clean_text(experience.description) if experience.description else None
                        }
                        alumni_data["experiences"].append(experience_data)

                    all_scraped_data.append(alumni_data)
                    
                except Exception as e:
                    print(f"❌ Error scraping {profile['name']}: {e}")
                    print("Error details:", str(e))
                    # Mark as failed in database
                    update_scraped_status_only(profile['id'], False)
                
                # Random delay between profiles
                time.sleep(random.uniform(4, 8))
            
            # Save progress after each batch
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"data/alumni_mega_{timestamp}.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(all_scraped_data, f, indent=2, ensure_ascii=False)
            print(f"\nProgress saved to {output_file}")
            
            # If there are more batches, pause for review
            if i + BATCH_SIZE < len(profiles):
                print("\nBatch completed. Review the data and press Enter to continue with the next batch...")
                input()
                print("Continuing with next batch...")
            
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        print("Error details:", str(e))
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass
    
    print("\nScraping completed!")
    print(f"Total profiles scraped: {len(all_scraped_data)}")
    if output_file:
        print(f"Final data saved to {output_file}")
    else:
        print("No data was saved due to errors.")

if __name__ == "__main__":
    main() 