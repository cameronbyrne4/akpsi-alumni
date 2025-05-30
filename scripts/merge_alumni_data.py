import pandas as pd
import os
from pathlib import Path
from datetime import datetime

# Define the categories we want to track
CATEGORIES = [
    'name', 'current_role', 'current_company', 'current_industry',
    'current_location', 'family_branch', 'graduation_year', 'big_brother',
    'little_brothers', 'linkedin_url', 'source_sheet', 'has_linkedin',
    'scraped', 'manually_verified', 'data_last_updated', 'career_history',
    'majors', 'minors', 'emails', 'phones'
]

# Define specific column mappings for different sheets
COLUMN_MAPPINGS = {
    'name': ['name', 'Name', 'Full Name', 'Full name'],
    'emails': ['email', 'Email', 'email address', 'Email Address'],
    'phones': ['phone', 'Phone', 'cell phone', 'Cell Phone', 'home phone', 'Home Phone', 'mobile', 'Mobile'],
    'current_location': ['address', 'Address', 'location', 'Location', 'current location', 'Current Location'],
    'linkedin_url': ['linkedin', 'LinkedIn', 'linkedin url', 'LinkedIn URL', 'linkedin profile', 'LinkedIn Profile'],
    'graduation_year': ['graduation year', 'Graduation year', 'grad year', 'Grad Year', 'year', 'Year', 'Graduation Year'],
    'family_branch': ['family', 'Family', 'family branch', 'Family Branch'],
    'big_brother': ['big', 'Big', 'big brother', 'Big Brother'],
    'little_brothers': ['littles', 'Littles', 'little brothers', 'Little Brothers'],
    'current_company': ['company', 'Company', 'employer', 'Employer'],
    'current_industry': ['industry', 'Industry'],
    'majors': ['major', 'Major', 'majors', 'Majors'],
    'minors': ['minor', 'Minor', 'minors', 'Minors'],
    'current_role': ['title', 'Title', 'position', 'Position', 'role', 'Role', 'job title', 'Job Title']
}

def clean_name(name):
    """Clean and standardize names for better matching."""
    if pd.isna(name):
        return None
    return str(name).strip().lower()

def merge_lists(list1, list2):
    """Merge two lists of strings, removing duplicates while preserving order."""
    if pd.isna(list1):
        return list2 if not pd.isna(list2) else None
    if pd.isna(list2):
        return list1
    return list(set(str(list1).split(',') + str(list2).split(',')))

def get_column_mapping(df_columns):
    """Create a mapping of our categories to the sheet's columns."""
    mapping = {}
    for category, possible_columns in COLUMN_MAPPINGS.items():
        # Find all matching columns in the dataframe
        matches = [col for col in df_columns if any(pc.lower() in col.lower() for pc in possible_columns)]
        if matches:
            mapping[category] = matches
    return mapping

def process_form1(df):
    """Process form1.csv specific formatting."""
    # Drop Timestamp column if it exists
    if 'Timestamp' in df.columns:
        df = df.drop('Timestamp', axis=1)
    
    # Combine City and State into current_location
    if 'City' in df.columns and 'State' in df.columns:
        df['current_location'] = df.apply(
            lambda row: f"{row['City']}, {row['State']}" if pd.notna(row['City']) and pd.notna(row['State']) else None,
            axis=1
        )
        df = df.drop(['City', 'State'], axis=1)
    
    return df

def process_mf_form2(df):
    """Process MF-Form2_2021-07-01.csv specific formatting."""
    current_industry = None
    processed_rows = []
    
    for _, row in df.iterrows():
        # Check if this is an industry header row
        if pd.isna(row['Title']) and pd.isna(row['Company']) and pd.isna(row['Email Address']):
            if pd.notna(row['Name (or industry)']):
                current_industry = row['Name (or industry)']
            continue
        
        # Skip empty rows
        if pd.isna(row['Name (or industry)']):
            continue
        
        # Create a new row with the current industry
        new_row = row.copy()
        new_row['current_industry'] = current_industry
        processed_rows.append(new_row)
    
    return pd.DataFrame(processed_rows)

def process_sheet(file_path, master_df):
    """Process a single sheet file and merge its data with the master dataframe."""
    print(f"Processing {file_path}...")
    
    # Read the sheet
    df = pd.read_csv(file_path)
    
    # Clean column names
    df.columns = [col.strip() for col in df.columns]
    
    # Apply specific processing based on filename
    filename = os.path.basename(file_path)
    if filename == 'form1.csv':
        df = process_form1(df)
    elif filename == 'MF-Form2_2021-07-01.csv':
        df = process_mf_form2(df)
    
    # Get column mapping
    column_mapping = get_column_mapping(df.columns)
    
    # Process each row
    for _, row in df.iterrows():
        name = clean_name(row.get('name', row.get('Name', row.get('Name (or industry)'))))
        if not name:
            continue
            
        # Find matching row in master_df
        mask = master_df['name'].str.lower() == name
        if not mask.any():
            # Add new entry
            new_row = {cat: None for cat in CATEGORIES}
            new_row['name'] = row.get('name', row.get('Name', row.get('Name (or industry)')))
            
            # Process each category
            for category, columns in column_mapping.items():
                if category in ['emails', 'phones']:
                    # Combine all matching columns
                    values = []
                    for col in columns:
                        if pd.notna(row.get(col)):
                            values.append(str(row.get(col)))
                    if values:
                        new_row[category] = ','.join(values)
                else:
                    # Use the first non-null value
                    for col in columns:
                        if pd.notna(row.get(col)):
                            new_row[category] = row.get(col)
                            break
            
            new_row['source_sheet'] = os.path.basename(file_path)
            new_row['data_last_updated'] = datetime.now().strftime('%Y-%m-%d')
            master_df = pd.concat([master_df, pd.DataFrame([new_row])], ignore_index=True)
        else:
            # Update existing entry
            idx = mask.idxmax()
            for category, columns in column_mapping.items():
                if category in ['emails', 'phones']:
                    # Combine all matching columns
                    values = []
                    for col in columns:
                        if pd.notna(row.get(col)):
                            values.append(str(row.get(col)))
                    if values:
                        new_value = ','.join(values)
                        master_df.at[idx, category] = merge_lists(master_df.at[idx, category], new_value)
                else:
                    # Use the first non-null value
                    for col in columns:
                        if pd.notna(row.get(col)):
                            master_df.at[idx, category] = row.get(col)
                            break
            
            master_df.at[idx, 'source_sheet'] = merge_lists(master_df.at[idx, 'source_sheet'], os.path.basename(file_path))
            master_df.at[idx, 'data_last_updated'] = datetime.now().strftime('%Y-%m-%d')
    
    return master_df

def main():
    # Create output directory if it doesn't exist
    output_dir = Path('data/processed')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Start with names.csv as the base
    master_df = pd.read_csv('data/raw/names.csv')
    
    # Initialize all categories with None
    for category in CATEGORIES:
        if category not in master_df.columns:
            master_df[category] = None
    
    # Process all sheet files
    sheets_dir = Path('data/raw/sheets')
    for file_path in sheets_dir.glob('*.csv'):
        master_df = process_sheet(file_path, master_df)
    
    # Save the consolidated file
    output_path = output_dir / 'consolidated_alumni.csv'
    master_df.to_csv(output_path, index=False)
    print(f"Consolidated data saved to {output_path}")

if __name__ == "__main__":
    main() 