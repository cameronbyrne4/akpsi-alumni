import pandas as pd
import re


# This function merges information from duplicate entries into a single entry, like names with different whitespace.
def normalize_name(name):
    # Remove extra whitespace and standardize spacing
    return re.sub(r'\s+', ' ', str(name).strip())

def merge_duplicates():
    # Read the consolidated data
    df = pd.read_csv('data/processed/consolidated_alumni.csv')
    
    # Create a normalized name column for comparison
    df['normalized_name'] = df['name'].apply(normalize_name)
    
    # Find duplicates based on normalized names
    duplicates = df[df.duplicated(subset=['normalized_name'], keep=False)]
    
    if not duplicates.empty:
        print("Found duplicate entries:")
        for name in duplicates['normalized_name'].unique():
            print(f"\nVariations of '{name}':")
            variations = df[df['normalized_name'] == name]
            for _, row in variations.iterrows():
                print(f"  - '{row['name']}'")
        
        # Group by normalized name and merge rows
        merged_df = df.groupby('normalized_name').agg({
            'name': lambda x: x.iloc[0],  # Keep the first name variation
            'current_role': lambda x: next((v for v in x if pd.notna(v)), None),
            'current_company': lambda x: next((v for v in x if pd.notna(v)), None),
            'current_industry': lambda x: next((v for v in x if pd.notna(v)), None),
            'current_location': lambda x: next((v for v in x if pd.notna(v)), None),
            'family_branch': lambda x: next((v for v in x if pd.notna(v)), None),
            'graduation_year': lambda x: next((v for v in x if pd.notna(v)), None),
            'big_brother': lambda x: next((v for v in x if pd.notna(v)), None),
            'little_brothers': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')])),
            'linkedin_url': lambda x: next((v for v in x if pd.notna(v)), None),
            'source_sheet': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')])),
            'has_linkedin': 'max',
            'scraped': 'max',
            'manually_verified': 'max',
            'career_history': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')])),
            'majors': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')])),
            'minors': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')])),
            'emails': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')])),
            'phones': lambda x: list(set([item for sublist in x if pd.notna(sublist) for item in str(sublist).split(',')]))
        }).reset_index(drop=True)
        
        # Save the merged data
        merged_df.to_csv('data/processed/consolidated_alumni.csv', index=False)
        print("\nMerged duplicates and saved to consolidated_alumni.csv")
        
        # Print summary
        print(f"\nOriginal number of entries: {len(df)}")
        print(f"New number of entries: {len(merged_df)}")
        print(f"Removed {len(df) - len(merged_df)} duplicate entries")
    else:
        print("No duplicates found!")

if __name__ == "__main__":
    merge_duplicates() 