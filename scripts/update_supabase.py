import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import numpy as np
from typing import List, Dict, Any
import logging
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env.local
load_dotenv('.env.local')

# Debug: Check if environment variables are loaded
logger.info("Checking environment variables...")
logger.info(f"NEXT_PUBLIC_SUPABASE_URL exists: {bool(os.getenv('NEXT_PUBLIC_SUPABASE_URL'))}")
logger.info(f"NEXT_PUBLIC_SUPABASE_ANON_KEY exists: {bool(os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))}")

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

def clean_value(value: Any) -> Any:
    """Clean a single value for JSON compatibility."""
    if isinstance(value, (list, np.ndarray)):
        return [clean_value(item) for item in value]
    if pd.isna(value) or value == 'nan' or value == 'NaN':
        return None
    if isinstance(value, str):
        value = value.strip()
        if value.lower() == 'nan' or value.lower() == 'none':
            return None
    return value

def clean_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Clean all values in a record for JSON compatibility."""
    return {k: clean_value(v) for k, v in record.items()}

def convert_to_array(value: Any) -> List[str]:
    """Convert a value to an array of strings."""
    if pd.isna(value) or value is None:
        return []
    if isinstance(value, str):
        # Split by comma and clean each item
        items = [item.strip() for item in value.split(',')]
        return [item for item in items if item and item.lower() not in ['nan', 'none']]
    return [str(value)]

def delete_existing_data() -> bool:
    """Delete all existing data from the alumni table."""
    try:
        # First get all records to delete
        response = supabase.table('alumni').select('id').execute()
        if response.data:
            # Delete each record by its ID
            for record in response.data:
                supabase.table('alumni').delete().eq('id', record['id']).execute()
        logger.info("Successfully deleted existing data")
        return True
    except Exception as e:
        logger.error(f"Error deleting existing data: {e}")
        return False

def update_table_structure():
    """Update the table structure if needed."""
    # The table structure is already correct based on the provided columns
    pass

def upload_alumni_data() -> bool:
    """Upload the consolidated alumni data to Supabase."""
    try:
        # Read the consolidated data
        df = pd.read_csv('data/processed/consolidated_alumni.csv')
        
        # Map our columns to Supabase columns
        column_mapping = {
            'name': 'name',
            'current_role': 'role',
            'current_company': 'companies',
            'current_industry': 'industry',  # This will be converted to array
            'current_location': 'location',
            'family_branch': 'family_branch',
            'graduation_year': 'graduation_year',
            'big_brother': 'big_brother',
            'little_brothers': 'little_brothers',
            'linkedin_url': 'linkedin_url',
            'source_sheet': 'source_sheet',
            'has_linkedin': 'has_linkedin',
            'scraped': 'scraped',
            'manually_verified': 'manually_verified',
            'career_history': 'career_history',
            'majors': 'majors',
            'minors': 'minors',
            'emails': 'emails',
            'phones': 'phones'
        }
        
        # Create a new DataFrame with only the columns we want to upload
        upload_df = df[column_mapping.keys()].rename(columns=column_mapping)
        
        # Clean the data
        for col in upload_df.columns:
            upload_df[col] = upload_df[col].apply(clean_value)
        
        # Convert array fields
        array_fields = ['companies', 'industry', 'little_brothers', 'emails', 'phones', 'majors', 'minors', 'career_history', 'source_sheet']
        for field in array_fields:
            if field in upload_df.columns:
                upload_df[field] = upload_df[field].apply(convert_to_array)
        
        # Convert graduation_year to integer (extract first 4-digit year from string)
        def extract_year(val):
            if pd.isnull(val):
                return None
            match = re.search(r'(\\d{4})', str(val))
            if match:
                return int(match.group(1))
            return None
        if 'graduation_year' in upload_df.columns:
            upload_df['graduation_year'] = upload_df['graduation_year'].apply(extract_year)
        
        # Convert DataFrame to list of dictionaries and clean each record
        records = [clean_record(record) for record in upload_df.to_dict('records')]
        
        # Upload in batches of 100
        batch_size = 100
        total_batches = (len(records) + batch_size - 1) // batch_size
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                response = supabase.table('alumni').insert(batch).execute()
                logger.info(f"Uploaded batch {i//batch_size + 1} of {total_batches}")
            except Exception as e:
                logger.error(f"Error uploading batch {i//batch_size + 1}: {e}")
                # Continue with next batch instead of failing completely
                continue
        
        logger.info("Successfully uploaded all alumni data")
        return True
    except Exception as e:
        logger.error(f"Error uploading alumni data: {e}")
        return False

def main():
    logger.info("Starting Supabase update process...")
    
    # Step 1: Delete existing data
    if not delete_existing_data():
        logger.error("Failed to delete existing data.")
        return
    
    # Step 2: Upload new data
    if not upload_alumni_data():
        logger.error("Failed to upload new data.")
        return
    
    logger.info("Supabase update completed successfully!")

if __name__ == "__main__":
    main() 