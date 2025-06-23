import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// State abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
}

// Common area abbreviations
const AREA_ABBREVIATIONS: Record<string, string> = {
  'san francisco bay area': 'SF Bay Area',
  'san francisco': 'SF',
  'los angeles': 'LA',
  'los angeles metropolitan area': 'LA Metro',
  'los angeles metropolitan area · hybrid': 'LA Metro',
  'new york city': 'NYC',
  'new york': 'NYC',
  'new york metropolitan area': 'NYC Metro',
  'washington dc': 'DC',
  'washington, dc': 'DC',
  'washington metropolitan area': 'DC Metro',
  'silicon valley': 'SV',
  'seattle area': 'Seattle',
  'seattle metropolitan area': 'Seattle Metro',
  'boston area': 'Boston',
  'boston metropolitan area': 'Boston Metro',
  'chicago area': 'Chicago',
  'chicago metropolitan area': 'Chicago Metro',
  'austin area': 'Austin',
  'austin metropolitan area': 'Austin Metro',
  'miami area': 'Miami',
  'miami metropolitan area': 'Miami Metro',
  'denver area': 'Denver',
  'denver metropolitan area': 'Denver Metro',
  'atlanta area': 'Atlanta',
  'atlanta metropolitan area': 'Atlanta Metro',
  'dallas area': 'Dallas',
  'dallas metropolitan area': 'Dallas Metro',
  'houston area': 'Houston',
  'houston metropolitan area': 'Houston Metro',
  'phoenix area': 'Phoenix',
  'phoenix metropolitan area': 'Phoenix Metro',
  'philadelphia area': 'Philly',
  'philadelphia': 'Philly',
  'philadelphia metropolitan area': 'Philly Metro',
  'detroit area': 'Detroit',
  'detroit metropolitan area': 'Detroit Metro',
  'minneapolis area': 'Minneapolis',
  'minneapolis metropolitan area': 'Minneapolis Metro',
  'portland area': 'Portland',
  'portland metropolitan area': 'Portland Metro',
  'nashville area': 'Nashville',
  'nashville metropolitan area': 'Nashville Metro',
  'orlando area': 'Orlando',
  'orlando metropolitan area': 'Orlando Metro',
  'tampa area': 'Tampa',
  'tampa metropolitan area': 'Tampa Metro',
  'las vegas area': 'Las Vegas',
  'las vegas': 'Vegas',
  'las vegas metropolitan area': 'Vegas Metro',
  'san diego area': 'San Diego',
  'san diego': 'SD',
  'san diego metropolitan area': 'SD Metro',
  'sacramento area': 'Sacramento',
  'sacramento metropolitan area': 'Sacramento Metro',
  'fresno area': 'Fresno',
  'fresno metropolitan area': 'Fresno Metro',
  'bakersfield area': 'Bakersfield',
  'bakersfield metropolitan area': 'Bakersfield Metro',
  'stockton area': 'Stockton',
  'stockton metropolitan area': 'Stockton Metro',
  'modesto area': 'Modesto',
  'modesto metropolitan area': 'Modesto Metro',
  'vallejo area': 'Vallejo',
  'vallejo metropolitan area': 'Vallejo Metro',
  'visalia area': 'Visalia',
  'visalia metropolitan area': 'Visalia Metro',
  'bakersfield': 'Bakersfield',
  'fresno': 'Fresno',
  'stockton': 'Stockton',
  'modesto': 'Modesto',
  'vallejo': 'Vallejo',
  'visalia': 'Visalia',
}

export function formatLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  
  // Split by commas and clean up whitespace
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    // Check if it's a single area name like "San Francisco Bay Area"
    const areaKey = location.toLowerCase();
    if (AREA_ABBREVIATIONS[areaKey]) {
      return AREA_ABBREVIATIONS[areaKey];
    }
    return location; // Return original if no comma
  }
  
  const city = parts[0];
  const stateOrCountry = parts[1].toLowerCase();
  
  // Check if it's a US state
  if (STATE_ABBREVIATIONS[stateOrCountry]) {
    return `${city}, ${STATE_ABBREVIATIONS[stateOrCountry]}`;
  }
  
  // Handle cases like "California Area" or "California · Hybrid"
  const stateMatch = stateOrCountry.match(/^([a-z\s]+)(?:\s+area|\s*·.*)?$/i);
  if (stateMatch) {
    const cleanState = stateMatch[1].trim().toLowerCase();
    if (STATE_ABBREVIATIONS[cleanState]) {
      return `${city}, ${STATE_ABBREVIATIONS[cleanState]}`;
    }
  }
  
  // Check if the full location matches an area abbreviation
  const fullLocationKey = location.toLowerCase();
  if (AREA_ABBREVIATIONS[fullLocationKey]) {
    return AREA_ABBREVIATIONS[fullLocationKey];
  }
  
  // If it's not a US state, return city and first part after comma
  return `${city}, ${parts[1]}`;
}

// City name mapping for filtering (full names to common variations)
const CITY_VARIATIONS: Record<string, string[]> = {
  'los angeles': ['la', 'los angeles'],
  'san francisco': ['sf', 'san francisco'],
  'new york': ['nyc', 'new york', 'new york city'],
  'washington': ['dc', 'washington', 'washington dc'],
  'las vegas': ['vegas', 'las vegas'],
  'san diego': ['sd', 'san diego'],
  'philadelphia': ['philly', 'philadelphia'],
  'atlanta': ['atlanta'],
  'chicago': ['chicago'],
  'boston': ['boston'],
  'seattle': ['seattle'],
  'austin': ['austin'],
  'miami': ['miami'],
  'denver': ['denver'],
  'dallas': ['dallas'],
  'houston': ['houston'],
  'phoenix': ['phoenix'],
  'detroit': ['detroit'],
  'minneapolis': ['minneapolis'],
  'portland': ['portland'],
  'nashville': ['nashville'],
  'orlando': ['orlando'],
  'tampa': ['tampa'],
  'sacramento': ['sacramento'],
  'fresno': ['fresno'],
  'bakersfield': ['bakersfield'],
  'stockton': ['stockton'],
  'modesto': ['modesto'],
  'vallejo': ['vallejo'],
  'visalia': ['visalia'],
  'huntington beach': ['huntington beach'],
  'santa barbara': ['santa barbara'],
  'santa monica': ['santa monica'],
  'long beach': ['long beach'],
  'irvine': ['irvine'],
  'anaheim': ['anaheim'],
  'glendale': ['glendale'],
  'pasadena': ['pasadena'],
  'burbank': ['burbank'],
  'culver city': ['culver city'],
  'manhattan beach': ['manhattan beach'],
  'redondo beach': ['redondo beach'],
  'hermosa beach': ['hermosa beach'],
  'torrance': ['torrance'],
  'gardena': ['gardena'],
  'hawthorne': ['hawthorne'],
  'inglewood': ['inglewood'],
  'compton': ['compton'],
  'carson': ['carson'],
  'lakewood': ['lakewood'],
  'cerritos': ['cerritos'],
  'norwalk': ['norwalk'],
  'bellflower': ['bellflower'],
  'paramount': ['paramount'],
  'downey': ['downey'],
  'whittier': ['whittier'],
  'la habra': ['la habra'],
  'fullerton': ['fullerton'],
  'brea': ['brea'],
  'placentia': ['placentia'],
  'yorba linda': ['yorba linda'],
  'garden grove': ['garden grove'],
  'westminster': ['westminster'],
  'fountain valley': ['fountain valley'],
  'newport beach': ['newport beach'],
  'costa mesa': ['costa mesa'],
  'lake forest': ['lake forest'],
  'mission viejo': ['mission viejo'],
  'laguna niguel': ['laguna niguel'],
  'dana point': ['dana point'],
  'san clemente': ['san clemente'],
  'san juan capistrano': ['san juan capistrano'],
  'laguna beach': ['laguna beach'],
  'aliso viejo': ['aliso viejo'],
  'laguna hills': ['laguna hills'],
  'rancho santa margarita': ['rancho santa margarita'],
  'coto de caza': ['coto de caza'],
  'ladera ranch': ['ladera ranch'],
}

export function extractCityForFiltering(location: string | null | undefined): string | null {
  if (!location) return null;
  
  const locationLower = location.toLowerCase();
  console.log(`🔍 extractCityForFiltering input: "${location}" -> "${locationLower}"`);
  
  // First, check if the full location matches any area abbreviations
  if (AREA_ABBREVIATIONS[locationLower]) {
    console.log(`🔍 Found area abbreviation: "${locationLower}" -> "${AREA_ABBREVIATIONS[locationLower]}"`);
    // For area abbreviations, extract the main city name
    const areaValue = AREA_ABBREVIATIONS[locationLower];
    
    // Special handling for metropolitan areas - map directly to main city
    if (locationLower.includes('los angeles metropolitan area')) {
      console.log(`🔍 LA Metro detected, returning "los angeles"`);
      return 'los angeles';
    }
    if (locationLower.includes('san francisco bay area')) {
      console.log(`🔍 SF Bay Area detected, returning "san francisco"`);
      return 'san francisco';
    }
    if (locationLower.includes('new york metropolitan area')) {
      console.log(`🔍 NYC Metro detected, returning "new york"`);
      return 'new york';
    }
    if (locationLower.includes('washington metropolitan area')) {
      console.log(`🔍 DC Metro detected, returning "washington"`);
      return 'washington';
    }
    
    // For other metropolitan areas, extract the city name (e.g., "LA Metro" -> "los angeles")
    if (areaValue.includes('Metro')) {
      // Reverse lookup to find the main city for this metro area
      for (const [key, value] of Object.entries(AREA_ABBREVIATIONS)) {
        if (value === areaValue) {
          const cityName = key.split(' ')[0]; // Return first word as city
          console.log(`🔍 Metro area reverse lookup: "${key}" -> "${cityName}"`);
          return cityName;
        }
      }
    }
    // For other area abbreviations, try to extract city name
    const result = areaValue.toLowerCase();
    console.log(`🔍 Area abbreviation result: "${result}"`);
    return result;
  }
  
  // Split by commas and clean up whitespace
  const parts = location.split(',').map(part => part.trim());
  console.log(`🔍 Split parts:`, parts);
  
  if (parts.length < 2) {
    // For single location names, try to match against area abbreviations
    const areaKey = locationLower;
    if (AREA_ABBREVIATIONS[areaKey]) {
      // Reverse lookup to find the main city
      for (const [key, value] of Object.entries(AREA_ABBREVIATIONS)) {
        if (value.toLowerCase() === areaKey) {
          const cityName = key.split(' ')[0]; // Return first word as city
          console.log(`🔍 Single location reverse lookup: "${key}" -> "${cityName}"`);
          return cityName;
        }
      }
    }
    console.log(`🔍 Single location result: "${locationLower}"`);
    return locationLower;
  }
  
  const city = parts[0].toLowerCase();
  console.log(`🔍 Extracted city: "${city}"`);
  
  // Check if this city has variations
  for (const [mainCity, variations] of Object.entries(CITY_VARIATIONS)) {
    if (variations.includes(city)) {
      console.log(`🔍 City variation found: "${city}" -> "${mainCity}"`);
      return mainCity;
    }
  }
  
  console.log(`🔍 Final result: "${city}"`);
  return city;
}

export function matchesCityFilter(location: string | null | undefined, filterCity: string): boolean {
  if (!location || !filterCity) return false;
  
  console.log(`🔍 matchesCityFilter: location="${location}", filterCity="${filterCity}"`);
  
  const locationCity = extractCityForFiltering(location);
  const filterCityLower = filterCity.toLowerCase();
  
  console.log(`🔍 Extracted locationCity: "${locationCity}", filterCityLower: "${filterCityLower}"`);
  
  if (!locationCity) return false;
  
  // Direct match
  if (locationCity === filterCityLower) {
    console.log(`🔍 Direct match found!`);
    return true;
  }
  
  // Check variations
  const variations = CITY_VARIATIONS[filterCityLower];
  if (variations && variations.includes(locationCity)) {
    console.log(`🔍 Variation match found!`);
    return true;
  }
  
  // Check if filter city is a variation of location city
  for (const [mainCity, cityVariations] of Object.entries(CITY_VARIATIONS)) {
    if (cityVariations.includes(filterCityLower) && locationCity === mainCity) {
      console.log(`🔍 Reverse variation match found!`);
      return true;
    }
  }
  
  console.log(`🔍 No match found`);
  return false;
}

const avatarImages = [
  '/avatars/pfpsamp1.png',
  '/avatars/pfpsamp2.png',
  '/avatars/pfpsamp3.png',
  '/avatars/pfpsamp4.png',
  '/avatars/pfpsamp5.png',
  '/avatars/pfpsamp6.png',
  '/avatars/pfpsamp7.png',
  '/avatars/pfpsamp8.png',
];

export function getRandomAvatar(name: string): string {
  // Simple hash function to get a number from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % avatarImages.length;
  return avatarImages[index];
}
