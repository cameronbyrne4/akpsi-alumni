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

def random_human_delay(min_sec=1, max_sec=3):
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)

def random_human_scroll_and_mouse(driver):
    # Reduced random scroll
    scroll_height = driver.execute_script("return document.body.scrollHeight")
    for _ in range(random.randint(1, 3)):  # Reduced from 2-5 to 1-3
        scroll_to = random.randint(0, scroll_height)
        driver.execute_script(f"window.scrollTo(0, {scroll_to});")
        time.sleep(random.uniform(0.3, 0.8))  # Reduced from 0.5-1.5 to 0.3-0.8
    # Reduced random mouse movement
    try:
        action = ActionChains(driver)
        for _ in range(random.randint(1, 3)):  # Reduced from 2-5 to 1-3
            x = random.randint(0, 800)
            y = random.randint(0, 600)
            action.move_by_offset(x, y).perform()
            time.sleep(random.uniform(0.1, 0.4))  # Reduced from 0.2-0.7 to 0.1-0.4
            action.move_by_offset(-x, -y).perform()
    except Exception:
        pass

def clean_linkedin_url(url: str) -> str:
    """Clean and format LinkedIn URL."""
    if not url:
        return None
    
    # Remove any leading/trailing whitespace
    url = url.strip()
    
    # Check if it's a valid LinkedIn URL
    if not url.startswith('http'):
        # If it doesn't start with http, it might be a username
        if '/' in url or ' ' in url or len(url) < 3:
            # Invalid format - contains spaces, slashes, or too short
            return None
        url = f"https://www.linkedin.com/in/{url}"
    
    # Validate that it's actually a LinkedIn URL
    if 'linkedin.com' not in url.lower():
        return None
    
    # If it's just a username, add the full URL
    if url.startswith('/'):
        url = url[1:]  # Remove leading slash
    if not url.startswith('http'):
        url = f"https://www.linkedin.com/in/{url}"
    
    # Convert /pub/ URLs to /in/ URLs
    if '/pub/' in url:
        # Extract the parts: /pub/name/id1/id2/id3
        parts = url.split('/')
        if len(parts) >= 7 and parts[3] == 'pub':
            name = parts[4]
            id1 = parts[5]
            id2 = parts[6]
            id3 = parts[7] if len(parts) > 7 else ''
            
            # Convert to /in/name-id3id2id1/
            converted_url = f"https://www.linkedin.com/in/{name}-{id3}{id2}{id1}/"
            print(f"Converted /pub/ URL: {url} → {converted_url}")
            url = converted_url
    
    # Clean mobile app parameters and UTM tracking codes
    if '?' in url:
        # Remove everything after the question mark (query parameters)
        base_url = url.split('?')[0]
        print(f"Cleaned mobile/UTM parameters: {url} → {base_url}")
        url = base_url
    
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
        # Check if we have a valid LinkedIn URL
        clean_url = clean_linkedin_url(linkedin_url)
        has_valid_linkedin = clean_url is not None
        
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
            'has_linkedin': has_valid_linkedin,  # Only true if we have a valid LinkedIn URL
            'scraped': True,
            'manually_verified': False,
            'career_history': career_history
        }
        
        # Only update linkedin_url if it's valid
        if has_valid_linkedin:
            update_data['linkedin_url'] = clean_url
        
        response = supabase.table('alumni').update(update_data).eq('id', profile_id).execute()
        print(f"✅ Successfully saved {person.name} to database (has_linkedin: {has_valid_linkedin})")
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
    # chrome_options.add_argument("--headless")  # Run in background (DISABLED for debugging)
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-notifications")
    
    # Store all scraped data
    all_scraped_data = []
    output_file = None  # Initialize output_file
    
    # Single browser session for all profiles
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(120)  # Reduced from 300 to 120 seconds
        
        # Try to load existing cookies first
        driver.get("https://www.linkedin.com")
        time.sleep(1)  # Reduced from 2 to 1
        
        if not load_cookies(driver):
            # If no cookies exist, login normally
            print("Logging in to LinkedIn...")
            actions.login(driver, email, password)
            time.sleep(random.uniform(2, 3))  # Reduced from 3-5 to 2-3
            # Save cookies after successful login
            save_cookies(driver)
        else:
            # Refresh page to apply cookies
            driver.refresh()
            time.sleep(2)  # Reduced from 3 to 2
        
        # Process all profiles continuously
        print(f"\nProcessing {len(profiles)} profiles...")
        
        for profile in profiles:
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
                    driver.set_page_load_timeout(120)  # Reduced from 300 to 120 seconds
                    driver.get("https://www.linkedin.com")
                    time.sleep(1)  # Reduced from 2 to 1
                    if not load_cookies(driver):
                        print("Logging in again...")
                        actions.login(driver, email, password)
                        time.sleep(random.uniform(2, 3))  # Reduced from 3-5 to 2-3
                        save_cookies(driver)
                    else:
                        driver.refresh()
                        time.sleep(2)  # Reduced from 3 to 2
                
                driver.get(profile['linkedin_url'])
                time.sleep(random.uniform(2, 3))  # Reduced from 3-5 to 2-3
                
                # Check for CAPTCHA
                if "checkpoint" in driver.current_url or "challenge" in driver.current_url:
                    print("\n⚠️ CAPTCHA detected! Please solve it manually.")
                    print("The script will automatically continue once the CAPTCHA is solved...")
                    
                    # Wait for CAPTCHA to be solved (URL will change)
                    while "checkpoint" in driver.current_url or "challenge" in driver.current_url:
                        time.sleep(1)  # Reduced from 2 to 1 second
                    
                    print("CAPTCHA solved! Continuing with scraping...")
                    # Save cookies after solving CAPTCHA
                    save_cookies(driver)
                    time.sleep(1)  # Reduced from 2 to 1
                
                # Random human-like behavior
                random_human_scroll_and_mouse(driver)
                
                # Scrape profile
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
            time.sleep(random.uniform(2, 4))  # Reduced from 4-8 to 2-4
            
            # Save progress after each profile
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"data/alumni_mega_{timestamp}.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(all_scraped_data, f, indent=2, ensure_ascii=False)
            print(f"Progress saved to {output_file}")
            
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