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
        for file in self.sheets_dir.glob('*.xlsx'):
            try:
                df = pd.read_excel(file)
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
        for category in self.industry_categories:
            if category.lower() in industry.lower():
                return category
        return 'Other'

    def standardize_location(self, location: str) -> str:
        """Standardize location format to 'City, State'."""
        if pd.isna(location):
            return 'Unknown'
        
        location = str(location).strip()
        # Add more standardization logic here if needed
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
        return str(email).strip().lower()

    def standardize_phone(self, phone: str) -> str:
        """Standardize phone number format, accepting various input formats."""
        if pd.isna(phone):
            return None
        
        # Convert to string and clean up
        phone = str(phone).strip()
        
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
        """Process all data and return a consolidated DataFrame."""
        # Load master names
        master_df = self.load_master_names()
        master_df['name'] = master_df['name'].str.strip()
        
        # Load and process source sheets
        source_dfs = self.load_source_sheets()
        
        # Initialize consolidated DataFrame with master names
        consolidated_df = pd.DataFrame({
            'name': master_df['name'],
            'current_role': 'Unknown',
            'current_company': 'Unknown',
            'current_industry': 'Unknown',
            'current_location': 'Unknown',
            'family_branch': 'Unknown',
            'graduation_year': None,
            'big_brother': 'Unknown',
            'linkedin_url': None,
            'picture_url': None,
            'bio': 'No bio provided',
            'source_sheet': None,
            'has_linkedin': False,
            'scraped': False,
            'manually_verified': False,
            'data_last_updated': None,
            # Multi-value fields
            'companies': None,
            'roles': None,
            'majors': None,
            'minors': None,
            'emails': None,
            'phones': None,
            'addresses': None,
            'industries': None
        })
        
        # Process each source sheet
        for df in source_dfs:
            # Map columns to standardized names
            mapped_df = self.map_columns(df)
            
            # Merge data into consolidated DataFrame
            for _, row in mapped_df.iterrows():
                name = row['name']
                if pd.isna(name):
                    continue
                
                # Find matching row in consolidated DataFrame
                mask = consolidated_df['name'] == name
                if not any(mask):
                    continue
                
                # Update fields if new data is more recent
                if row['sheet_date'] is not None:
                    current_date = consolidated_df.loc[mask, 'data_last_updated'].iloc[0]
                    if current_date is None or row['sheet_date'] > current_date:
                        # Update current information
                        for field in ['current_role', 'current_company', 'current_industry', 'current_location']:
                            if pd.notna(row[field]):
                                consolidated_df.loc[mask, field] = row[field]
                        
                        # Update data_last_updated
                        consolidated_df.loc[mask, 'data_last_updated'] = row['sheet_date']
                
                # Always update multi-value fields
                for field in ['companies', 'roles', 'majors', 'minors', 'emails', 'phones', 'addresses', 'industries']:
                    if pd.notna(row[field]):
                        current_values = consolidated_df.loc[mask, field].iloc[0]
                        if current_values is None:
                            current_values = []
                        new_values = str(row[field]).split(',')
                        consolidated_df.loc[mask, field] = list(set(current_values + new_values))
        
        # Apply standardization
        consolidated_df['current_industry'] = consolidated_df['current_industry'].apply(self.standardize_industry)
        consolidated_df['current_location'] = consolidated_df['current_location'].apply(self.standardize_address)
        consolidated_df['graduation_year'] = consolidated_df['graduation_year'].apply(self.standardize_graduation_year)
        
        # Standardize multi-value fields
        for field in ['companies', 'roles', 'majors', 'minors', 'emails', 'phones', 'addresses', 'industries']:
            consolidated_df[field] = consolidated_df[field].apply(
                lambda x: [str(i).strip() for i in x] if isinstance(x, list) else []
            )
        
        return consolidated_df

    def generate_supabase_import(self, df: pd.DataFrame) -> None:
        """Generate SQL insert statements for Supabase import."""
        output_file = self.processed_dir / 'supabase_import.sql'
        
        with open(output_file, 'w') as f:
            f.write('-- Supabase Alumni Import\n\n')
            f.write('INSERT INTO alumni (\n')
            f.write('  name, current_role, current_company, current_industry, current_location,\n')
            f.write('  family_branch, graduation_year, big_brother, linkedin_url, picture_url,\n')
            f.write('  bio, source_sheet, has_linkedin, scraped, manually_verified,\n')
            f.write('  data_last_updated, companies, roles, majors, minors, emails, phones, addresses, industries\n')
            f.write(') VALUES\n')
            
            for _, row in df.iterrows():
                values = []
                for col in df.columns:
                    if col in self.multi_value_fields:
                        # Convert to PostgreSQL array
                        val = row[col]
                        if pd.isna(val) or (isinstance(val, list) and len(val) == 0):
                            values.append('ARRAY[]::text[]')
                        else:
                            arr = [f"'{str(x).strip()}'" for x in val]
                            values.append(f"ARRAY[{','.join(arr)}]")
                    else:
                        val = row[col]
                        if pd.isna(val):
                            values.append('NULL')
                        else:
                            values.append(f"'{str(val).strip()}'")
                
                f.write(f"({','.join(values)}),\n")
            
            f.write(';\n')

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