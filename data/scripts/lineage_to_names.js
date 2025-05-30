// Script to extract all names from the family tree CSV files
// This is just the script used by Claude AI. Idk how to run it. But you should probably begin by downloading all of the family trees from the google drive folder as .csv
// Running it in Claude is the way to go. Then copy and paste the names into the names.csv file.
const Papa = require('papaparse');

async function extractAllNames() {
    const allNames = new Set(); // Use Set to avoid duplicates
    
    // List of all family tree files
    const files = [
        'Brecek Family Tree - Tree Lineage.csv',
        'Brugos Family Tree - Sheet1.csv',
        'Cauntay Family Tree - Sheet1.csv',
        'Chou Family Tree - Sheet1.csv',
        'Heller Family Tree - Sheet1.csv',
        'Johnson Family Tree - Lineage.csv',
        'Li Family Tree - Sheet1.csv',
        'Magpantay Family Tree - Sheet1.csv',
        'Paahana Family Tree - Lineage.csv'
    ];
    
    for (const filename of files) {
        try {
            console.log(`Processing ${filename}...`);
            
            // Read the file
            const csvData = await window.fs.readFile(filename, { encoding: 'utf8' });
            
            // Parse CSV with Papa Parse
            const parsed = Papa.parse(csvData, {
                skipEmptyLines: true,
                dynamicTyping: false
            });
            
            // Extract names from all cells
            parsed.data.forEach(row => {
                row.forEach(cell => {
                    if (cell && typeof cell === 'string') {
                        const trimmedCell = cell.trim();
                        
                        // Skip if empty, contains only spaces, or looks like a header
                        if (!trimmedCell || 
                            trimmedCell.toLowerCase().includes('family tree') ||
                            trimmedCell.toLowerCase().includes('updated') ||
                            /^\d+\/\d+\/\d+$/.test(trimmedCell)) {
                            return;
                        }
                        
                        // Clean up the name
                        let cleanName = trimmedCell
                            .replace(/\n/g, ' ') // Replace newlines with spaces
                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                            .trim();
                        
                        // Skip very short entries that might not be names
                        if (cleanName.length < 2) return;
                        
                        // Add to our set of names
                        if (cleanName) {
                            allNames.add(cleanName);
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error(`Error processing ${filename}:`, error);
        }
    }
    
    // Convert Set to Array and sort alphabetically
    const sortedNames = Array.from(allNames).sort();
    
    console.log(`Total unique names found: ${sortedNames.length}`);
    
    // Create CSV content
    const csvContent = 'name\n' + sortedNames.map(name => `"${name}"`).join('\n');
    
    // Display the result
    console.log('\nGenerated names.csv content:');
    console.log(csvContent);
    
    return csvContent;
}

// Run the extraction
extractAllNames().catch(console.error);