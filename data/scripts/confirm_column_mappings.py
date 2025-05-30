import pandas as pd
import json
import os

def load_column_mappings():
    """Load existing column mappings from JSON file."""
    with open('data/scripts/column_mappings.json', 'r') as f:
        return json.load(f)

def save_column_mappings(mappings):
    """Save column mappings to JSON file."""
    with open('data/scripts/column_mappings.json', 'w') as f:
        json.dump(mappings, f, indent=4)

def get_unique_columns():
    """Get all unique column names from sheets.csv."""
    df = pd.read_csv('data/sheets/sheets.csv')
    return sorted(df.columns.unique())

def confirm_mappings():
    """Interactive process to confirm column mappings."""
    # Load existing mappings
    mappings = load_column_mappings()
    
    # Create reverse mapping for easier lookup
    reverse_mappings = {}
    for field, mapping in mappings.items():
        reverse_mappings[mapping['primary']] = field
        for alt in mapping['alternatives']:
            reverse_mappings[alt] = field
    
    # Get all unique columns from sheets.csv
    columns = get_unique_columns()
    
    print("\nColumn Mapping Confirmation")
    print("==========================")
    print("For each column, you can:")
    print("1. Map it to an existing field")
    print("2. Add it as an alternative for an existing field")
    print("3. Skip it")
    print("4. Add it as a new field")
    print("\nPress Ctrl+C at any time to save and exit\n")
    
    for column in columns:
        column_lower = column.lower().strip()
        
        # Check if column is already mapped
        if column_lower in reverse_mappings:
            mapped_field = reverse_mappings[column_lower]
            print(f"\nColumn '{column}' is already mapped to '{mapped_field}'")
            continue
        
        print(f"\nColumn: '{column}'")
        print("Options:")
        print("1. Map to existing field")
        print("2. Add as alternative")
        print("3. Skip")
        print("4. Add as new field")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            # Map to existing field
            print("\nAvailable fields:")
            for i, field in enumerate(mappings.keys(), 1):
                print(f"{i}. {field}")
            
            field_idx = int(input("\nEnter field number: ")) - 1
            field = list(mappings.keys())[field_idx]
            
            # Update the primary mapping
            mappings[field]['primary'] = column_lower
            print(f"Mapped '{column}' as primary for '{field}'")
            
        elif choice == '2':
            # Add as alternative
            print("\nAvailable fields:")
            for i, field in enumerate(mappings.keys(), 1):
                print(f"{i}. {field}")
            
            field_idx = int(input("\nEnter field number: ")) - 1
            field = list(mappings.keys())[field_idx]
            
            # Add as alternative
            mappings[field]['alternatives'].append(column_lower)
            print(f"Added '{column}' as alternative for '{field}'")
            
        elif choice == '3':
            # Skip
            print("Skipped")
            continue
            
        elif choice == '4':
            # Add as new field
            field_name = input("\nEnter new field name (snake_case): ").strip()
            
            # Create new mapping
            mappings[field_name] = {
                'primary': column_lower,
                'alternatives': []
            }
            print(f"Added new field '{field_name}' with primary mapping '{column}'")
            
        else:
            print("Invalid choice, skipping")
            continue
        
        # Save after each change
        save_column_mappings(mappings)
    
    print("\nAll columns processed. Mappings saved to column_mappings.json")

if __name__ == '__main__':
    confirm_mappings() 