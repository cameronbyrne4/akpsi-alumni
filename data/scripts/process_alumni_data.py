import pandas as pd
import numpy as np
from pathlib import Path
import json
from typing import List, Dict, Any
import logging
from datetime import datetime
import os
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlumniDataProcessor:
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / 'raw'
        self.processed_dir = self.data_dir / 'processed'
        self.sheets_dir = self.raw_dir / 'sheets'
        
        # Create directories if they don't exist
        self.sheets_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        # Load column mappings
        with open(self.data_dir / 'scripts' / 'column_mappings.json', 'r') as f:
            self.column_mappings = json.load(f)
        
        # Standard industry categories
        self.industry_categories = [
            'Technology', 'Finance', 'Healthcare', 'Marketing', 
            'Consulting', 'Education', 'Government', 'Non-Profit'
        ]
        
        # Standard family branches
        self.family_branches = ['Lambda', 'Omega', 'Gamma', 'Delta', 'Alpha', 'Beta']

        # Fields that can have multiple values
        self.multi_value_fields = {
            'companies': 'Previous Companies',
            'roles': 'Previous Roles',
            'majors': 'Majors',
            'minors': 'Minors',
            'emails': 'Email Addresses',
            'phones': 'Phone Numbers',
            'addresses': 'Previous Addresses',
            'industries': 'Previous Industries'
        }

    def load_master_names(self) -> pd.DataFrame:
        """Load the master list of names."""
        names_file = self.raw_dir / 'names.csv'
        if not names_file.exists():
            raise FileNotFoundError(f"Master names file not found at {names_file}")
        
        return pd.read_csv(names_file)

    def load_source_sheets(self) -> List[pd.DataFrame]:
        """Load all source sheets from the sheets directory."""
        sheets = []
        for file in self.sheets_dir.glob('*.*'):
            try:
                if file.suffix.lower() in ['.xlsx', '.xls']:
                    df = pd.read_excel(file)
                elif file.suffix.lower() == '.csv':
                    df = pd.read_csv(file)
                else:
                    continue
                
                df['source_sheet'] = file.stem
                # Add sheet date if available in filename (format: YYYY-MM-DD)
                try:
                    date_str = file.stem.split('_')[-1]
                    df['sheet_date'] = datetime.strptime(date_str, '%Y-%m-%d').date()
                except:
                    df['sheet_date'] = None
                sheets.append(df)
                logger.info(f"Loaded sheet: {file.stem}")
            except Exception as e:
                logger.error(f"Error loading {file}: {str(e)}")
        return sheets

    def map_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map source sheet columns to standardized column names."""
        mapped_df = pd.DataFrame()
        
        # First, normalize all column names to lowercase
        df.columns = [str(col).lower().strip() for col in df.columns]
        
        # Map each column based on our mappings
        for field, mapping in self.column_mappings.items():
            # Try primary name first
            if mapping['primary'] in df.columns:
                mapped_df[field] = df[mapping['primary']]
            else:
                # Try alternatives
                for alt in mapping['alternatives']:
                    if alt in df.columns:
                        mapped_df[field] = df[alt]
                        break
                else:
                    # If no mapping found, create empty column
                    mapped_df[field] = None
        
        # Preserve source information
        mapped_df['source_sheet'] = df['source_sheet']
        mapped_df['sheet_date'] = df['sheet_date']
        
        return mapped_df

    def standardize_industry(self, industry: str) -> str:
        """Standardize industry to one of the predefined categories."""
        if pd.isna(industry):
            return 'Unknown'
        
        industry = str(industry).strip().title()
        
        # Map common variations to standard categories
        industry_mapping = {
            'tech': 'Technology',
            'software': 'Technology',
            'it': 'Technology',
            'finance': 'Finance',
            'banking': 'Finance',
            'accounting': 'Finance',
            'healthcare': 'Healthcare',
            'medical': 'Healthcare',
            'health': 'Healthcare',
            'marketing': 'Marketing',
            'consulting': 'Consulting',
            'education': 'Education',
            'government': 'Government',
            'non-profit': 'Non-Profit',
            'nonprofit': 'Non-Profit'
        }
        
        # Check for exact matches first
        for category in self.industry_categories:
            if category.lower() == industry.lower():
                return category
        
        # Check for partial matches
        for category in self.industry_categories:
            if category.lower() in industry.lower():
                return category
        
        # Check mapping dictionary
        for key, value in industry_mapping.items():
            if key in industry.lower():
                return value
        
        return 'Other'

    def standardize_location(self, location: str) -> str:
        """Standardize location format to 'City, State'."""
        if pd.isna(location):
            return 'Unknown'
        
        # Convert to string and clean up
        location = str(location).strip()
        
        # Remove common prefixes/suffixes
        location = re.sub(r'^(apt\.?|apartment|unit|#)\s*[a-z0-9-]+[,\s]*', '', location, flags=re.IGNORECASE)
        location = re.sub(r'[,\s]+(apt\.?|apartment|unit|#)\s*[a-z0-9-]+$', '', location, flags=re.IGNORECASE)
        
        # Try to extract city and state
        # Common patterns:
        # City, State
        # City, ST
        # City, State ZIP
        # City, ST ZIP
        # City State
        # City ST
        
        # First try to match "City, State" or "City, ST" pattern
        match = re.match(r'^([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5})?$', location)
        if match:
            city, state = match.groups()
            return f"{city.strip()}, {state.upper()}"
        
        # Try to match "City State" or "City ST" pattern
        match = re.match(r'^([^,]+)\s+([A-Za-z]{2})(?:\s+\d{5})?$', location)
        if match:
            city, state = match.groups()
            return f"{city.strip()}, {state.upper()}"
        
        # If we can't parse it, return the original
        return location

    def standardize_graduation_year(self, year: Any) -> int:
        """Standardize graduation year to be between 2000 and 2025."""
        try:
            year = int(float(str(year)))
            if 2000 <= year <= 2025:
                return year
            return None
        except (ValueError, TypeError):
            return None

    def standardize_email(self, email: str) -> str:
        """Standardize email format."""
        if pd.isna(email):
            return None
        
        email = str(email).strip().lower()
        
        # Remove common prefixes/suffixes
        email = re.sub(r'^(email|e-mail|mail):\s*', '', email, flags=re.IGNORECASE)
        email = re.sub(r'\s*\(.*\)$', '', email)
        
        # Basic email validation
        if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return email
        return None

    def standardize_phone(self, phone: str) -> str:
        """Standardize phone number format, accepting various input formats."""
        if pd.isna(phone):
            return None
        
        # Convert to string and clean up
        phone = str(phone).strip()
        
        # Remove common prefixes/suffixes
        phone = re.sub(r'^(phone|tel|telephone|mobile|cell):\s*', '', phone, flags=re.IGNORECASE)
        phone = re.sub(r'\s*\(.*\)$', '', phone)
        
        # If it's already in a good format, return as is
        if re.match(r'^\(\d{3}\)\s\d{3}-\d{4}$', phone):
            return phone
            
        # Try to extract just the digits
        digits = ''.join(filter(str.isdigit, phone))
        
        # If we have exactly 10 digits, format it
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        
        # If we have exactly 11 digits and starts with 1, format it
        if len(digits) == 11 and digits.startswith('1'):
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        
        # If we can't parse it into a standard format, return the original
        return phone

    def standardize_address(self, location: str) -> str:
        """Standardize address format to 'City, State'."""
        if pd.isna(location):
            return None
        
        # Convert to string and clean up
        location = str(location).strip()
        
        # Try to extract city and state
        # Common patterns:
        # City, State
        # City, ST
        # City, State ZIP
        # City, ST ZIP
        # City State
        # City ST
        
        # First try to match "City, State" or "City, ST" pattern
        match = re.match(r'^([^,]+),\s*([A-Za-z]{2})(?:\s+\d{5})?$', location)
        if match:
            city, state = match.groups()
            return f"{city.strip()}, {state.upper()}"
        
        # Try to match "City State" or "City ST" pattern
        match = re.match(r'^([^,]+)\s+([A-Za-z]{2})(?:\s+\d{5})?$', location)
        if match:
            city, state = match.groups()
            return f"{city.strip()}, {state.upper()}"
        
        # If we can't parse it, return the original
        return location

    def process_data(self) -> pd.DataFrame:
        """Process all source sheets and consolidate into a single DataFrame."""
        # Initialize consolidated DataFrame with default values
        consolidated = pd.DataFrame(columns=[
            'name', 'current_role', 'current_company', 'current_industry', 
            'current_location', 'family_branch', 'graduation_year', 'big_brother',
            'little_brothers', 'linkedin_url', 'source_sheet', 'has_linkedin', 'scraped', 
            'manually_verified', 'data_last_updated', 'career_history',
            'majors', 'minors', 'emails', 'phones'
        ], dtype=object)
        
        # Load master names
        master_names = self.load_master_names()
        consolidated['name'] = master_names['name']
        
        # Initialize arrays for multi-value fields
        consolidated['career_history'] = consolidated['career_history'].apply(lambda x: [])
        consolidated['majors'] = consolidated['majors'].apply(lambda x: [])
        consolidated['minors'] = consolidated['minors'].apply(lambda x: [])
        consolidated['emails'] = consolidated['emails'].apply(lambda x: [])
        consolidated['phones'] = consolidated['phones'].apply(lambda x: [])
        consolidated['little_brothers'] = consolidated['little_brothers'].apply(lambda x: [])
        
        # Process each source sheet
        for sheet in self.load_source_sheets():
            # Map columns to standardized names
            mapped_sheet = self.map_columns(sheet)
            
            # Process each row
            for _, row in mapped_sheet.iterrows():
                name = row['name']
                if pd.isna(name):
                    continue
                
                # Find matching row in consolidated DataFrame
                mask = consolidated['name'].str.lower() == name.lower()
                if not mask.any():
                    # Add new row if name not found
                    new_row = pd.Series(index=consolidated.columns)
                    new_row['name'] = name
                    new_row['career_history'] = []
                    new_row['majors'] = []
                    new_row['minors'] = []
                    new_row['emails'] = []
                    new_row['phones'] = []
                    new_row['little_brothers'] = []
                    consolidated = pd.concat([consolidated, pd.DataFrame([new_row])], ignore_index=True)
                    mask = consolidated['name'].str.lower() == name.lower()
                
                # Get the index of the matching row
                idx = mask.idxmax()
                
                # Create career history entry
                career_entry = {
                    'role': row.get('current_role'),
                    'company': row.get('current_company'),
                    'industry': self.standardize_industry(row.get('current_industry')),
                    'location': self.standardize_location(row.get('current_location')),
                    'date': row.get('sheet_date')
                }
                
                # Only add career entry if we have at least one non-null value
                if any(v is not None and v != 'Unknown' for v in career_entry.values()):
                    consolidated.at[idx, 'career_history'].append(career_entry)
                
                # Update current values with most recent data
                if row.get('current_role') and row.get('current_role') != 'Unknown':
                    consolidated.at[idx, 'current_role'] = row['current_role']
                if row.get('current_company') and row.get('current_company') != 'Unknown':
                    consolidated.at[idx, 'current_company'] = row['current_company']
                if row.get('current_industry') and row.get('current_industry') != 'Unknown':
                    consolidated.at[idx, 'current_industry'] = self.standardize_industry(row['current_industry'])
                if row.get('current_location') and row.get('current_location') != 'Unknown':
                    consolidated.at[idx, 'current_location'] = self.standardize_location(row['current_location'])
                
                # Update other fields
                if row.get('family_branch') and row.get('family_branch') != 'Unknown':
                    consolidated.at[idx, 'family_branch'] = row['family_branch']
                if row.get('graduation_year'):
                    consolidated.at[idx, 'graduation_year'] = self.standardize_graduation_year(row['graduation_year'])
                if row.get('big_brother') and row.get('big_brother') != 'Unknown':
                    consolidated.at[idx, 'big_brother'] = row['big_brother']
                if row.get('little_brothers'):
                    littles = [l.strip() for l in str(row['little_brothers']).split(',') if l.strip()]
                    consolidated.at[idx, 'little_brothers'].extend(littles)
                if row.get('linkedin_url'):
                    consolidated.at[idx, 'linkedin_url'] = row['linkedin_url']
                    consolidated.at[idx, 'has_linkedin'] = True
                
                # Update multi-value fields
                if row.get('majors'):
                    majors = [m.strip() for m in str(row['majors']).split(',') if m.strip()]
                    consolidated.at[idx, 'majors'].extend(majors)
                if row.get('minors'):
                    minors = [m.strip() for m in str(row['minors']).split(',') if m.strip()]
                    consolidated.at[idx, 'minors'].extend(minors)
                if row.get('emails'):
                    email = self.standardize_email(row['emails'])
                    if email and email not in consolidated.at[idx, 'emails']:
                        consolidated.at[idx, 'emails'].append(email)
                if row.get('phones'):
                    phone = self.standardize_phone(row['phones'])
                    if phone and phone not in consolidated.at[idx, 'phones']:
                        consolidated.at[idx, 'phones'].append(phone)
                
                # Update metadata
                consolidated.at[idx, 'source_sheet'] = row['source_sheet']
                consolidated.at[idx, 'data_last_updated'] = row.get('sheet_date')
        
        # Sort career history by date (most recent first)
        for idx in consolidated.index:
            career_history = consolidated.at[idx, 'career_history']
            # Convert all date objects in career_history to ISO strings
            for entry in career_history:
                if isinstance(entry.get('date'), (datetime, pd.Timestamp)):
                    entry['date'] = entry['date'].date().isoformat() if hasattr(entry['date'], 'date') else entry['date'].isoformat()
                elif hasattr(entry.get('date'), 'isoformat'):
                    entry['date'] = entry['date'].isoformat()
            career_history.sort(key=lambda x: x['date'] if x['date'] else '', reverse=True)
            consolidated.at[idx, 'career_history'] = career_history
            # Set current values from most recent career entry
            if career_history:
                latest = career_history[0]
                if latest['role']:
                    consolidated.at[idx, 'current_role'] = latest['role']
                if latest['company']:
                    consolidated.at[idx, 'current_company'] = latest['company']
                if latest['industry']:
                    consolidated.at[idx, 'current_industry'] = latest['industry']
                if latest['location']:
                    consolidated.at[idx, 'current_location'] = latest['location']
            # Convert data_last_updated to ISO string if it's a date
            if isinstance(consolidated.at[idx, 'data_last_updated'], (datetime, pd.Timestamp)):
                consolidated.at[idx, 'data_last_updated'] = consolidated.at[idx, 'data_last_updated'].date().isoformat() if hasattr(consolidated.at[idx, 'data_last_updated'], 'date') else consolidated.at[idx, 'data_last_updated'].isoformat()
            elif hasattr(consolidated.at[idx, 'data_last_updated'], 'isoformat'):
                consolidated.at[idx, 'data_last_updated'] = consolidated.at[idx, 'data_last_updated'].isoformat()
        
        # Remove duplicates from multi-value fields
        for field in ['majors', 'minors', 'emails', 'phones', 'little_brothers']:
            consolidated[field] = consolidated[field].apply(lambda x: list(set(x)) if x else [])
        
        return consolidated

    def generate_supabase_import(self, df: pd.DataFrame) -> None:
        """Generate SQL import statements for Supabase."""
        # Create SQL file
        with open('data/processed/supabase_import.sql', 'w') as f:
            # Write header
            f.write("-- Generated SQL import statements for Supabase\n\n")
            
            # Write INSERT statements
            for _, row in df.iterrows():
                # Convert career history to JSONB array
                career_history = json.dumps(row['career_history']) if row['career_history'] else '[]'
                
                # Convert multi-value fields to JSONB arrays
                majors = json.dumps(row['majors']) if row['majors'] else '[]'
                minors = json.dumps(row['minors']) if row['minors'] else '[]'
                emails = json.dumps(row['emails']) if row['emails'] else '[]'
                phones = json.dumps(row['phones']) if row['phones'] else '[]'
                little_brothers = json.dumps(row['little_brothers']) if row['little_brothers'] else '[]'
                
                # Create INSERT statement
                sql = f"""INSERT INTO alumni (
                    name, current_role, current_company, current_industry, 
                    current_location, family_branch, graduation_year, big_brother,
                    little_brothers, linkedin_url, source_sheet, has_linkedin, scraped, 
                    manually_verified, data_last_updated, career_history,
                    majors, minors, emails, phones
                ) VALUES (
                    '{row['name'].replace("'", "''")}',
                    {f"'{row['current_role'].replace("'", "''")}'" if pd.notna(row['current_role']) else 'NULL'},
                    {f"'{row['current_company'].replace("'", "''")}'" if pd.notna(row['current_company']) else 'NULL'},
                    {f"'{row['current_industry'].replace("'", "''")}'" if pd.notna(row['current_industry']) else 'NULL'},
                    {f"'{row['current_location'].replace("'", "''")}'" if pd.notna(row['current_location']) else 'NULL'},
                    {f"'{row['family_branch'].replace("'", "''")}'" if pd.notna(row['family_branch']) else 'NULL'},
                    {f"'{row['graduation_year']}'" if pd.notna(row['graduation_year']) else 'NULL'},
                    {f"'{row['big_brother'].replace("'", "''")}'" if pd.notna(row['big_brother']) else 'NULL'},
                    '{little_brothers}'::jsonb,
                    {f"'{row['linkedin_url'].replace("'", "''")}'" if pd.notna(row['linkedin_url']) else 'NULL'},
                    {f"'{row['source_sheet'].replace("'", "''")}'" if pd.notna(row['source_sheet']) else 'NULL'},
                    {str(row['has_linkedin']).lower()},
                    {str(row['scraped']).lower()},
                    {str(row['manually_verified']).lower()},
                    {f"'{row['data_last_updated']}'" if pd.notna(row['data_last_updated']) else 'NULL'},
                    '{career_history}'::jsonb,
                    '{majors}'::jsonb,
                    '{minors}'::jsonb,
                    '{emails}'::jsonb,
                    '{phones}'::jsonb
                ) ON CONFLICT (name) DO UPDATE SET
                    current_role = EXCLUDED.current_role,
                    current_company = EXCLUDED.current_company,
                    current_industry = EXCLUDED.current_industry,
                    current_location = EXCLUDED.current_location,
                    family_branch = EXCLUDED.family_branch,
                    graduation_year = EXCLUDED.graduation_year,
                    big_brother = EXCLUDED.big_brother,
                    little_brothers = EXCLUDED.little_brothers,
                    linkedin_url = EXCLUDED.linkedin_url,
                    source_sheet = EXCLUDED.source_sheet,
                    has_linkedin = EXCLUDED.has_linkedin,
                    scraped = EXCLUDED.scraped,
                    manually_verified = EXCLUDED.manually_verified,
                    data_last_updated = EXCLUDED.data_last_updated,
                    career_history = EXCLUDED.career_history,
                    majors = EXCLUDED.majors,
                    minors = EXCLUDED.minors,
                    emails = EXCLUDED.emails,
                    phones = EXCLUDED.phones,
                    updated_at = CURRENT_TIMESTAMP;\n"""
                
                f.write(sql)

def main():
    processor = AlumniDataProcessor('data')
    try:
        # Process the data
        consolidated_df = processor.process_data()
        
        # Save processed data
        consolidated_df.to_csv(processor.processed_dir / 'consolidated_alumni.csv', index=False)
        
        # Generate Supabase import
        processor.generate_supabase_import(consolidated_df)
        
        logger.info("Data processing completed successfully!")
        
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")

if __name__ == "__main__":
    main() 