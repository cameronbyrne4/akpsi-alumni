interface CompanyColor {
  bg: string;
  text: string;
}

export const companyColors: Record<string, CompanyColor> = {
    "Apple": { bg: "#e3f2fd", text: "#007aff" },
    "Microsoft": { bg: "#e6f2fb", text: "#0067b8" },
    "Google": { bg: "#e8f0fe", text: "#1a73e8" },
    "Amazon": { bg: "#fff8e1", text: "#ff9900" },
    "Meta": { bg: "#e8eaf6", text: "#1877f2" },
    "Tesla": { bg: "#fdebec", text: "#cc0000" },
    "NVIDIA": { bg: "#eaf7e8", text: "#76b900" },
    "Berkshire Hathaway": { bg: "#fdecea", text: "#ce2f27" },
    "JPMorgan Chase": { bg: "#e6f5f5", text: "#00958f" },
    "Johnson & Johnson": { bg: "#fdebec", text: "#d00000" },
    "Exxon Mobil": { bg: "#fdebec", text: "#d91f2a" },
    "Walmart": { bg: "#e6f2fb", text: "#0071ce" },
    "Procter & Gamble": { bg: "#e6f2fb", text: "#005a9c" },
    "Bank of America": { bg: "#fdebec", text: "#d4002f" },
    "Home Depot": { bg: "#fff3e0", text: "#f96302" },
    "Mastercard": { bg: "#fff3e0", text: "#ff5f00" },
    "UnitedHealth Group": { bg: "#e6f2fb", text: "#005a9c" },
    "Visa": { bg: "#e7eefe", text: "#1a1f71" },
    "Chevron": { bg: "#e6f2fb", text: "#0071ce" },
    "Abbvie": { bg: "#e8e8f4", text: "#001a71" },
    "Eli Lilly": { bg: "#fef7e0", text: "#f2a900" },
    "Broadcom": { bg: "#fdebec", text: "#d91f2a" },
    "Coca-Cola": { bg: "#fdebec", text: "#f40000" },
    "PepsiCo": { bg: "#e6f2fb", text: "#004b93" },
    "Costco": { bg: "#fdebec", text: "#e03021" },
    "Merck": { bg: "#e6f5f5", text: "#009999" },
    "McDonald's": { bg: "#fef7e0", text: "#ffc700" },
    "Cisco": { bg: "#e6f2fb", text: "#0066a3" },
    "Verizon": { bg: "#fdebec", text: "#cd040b" },
    "AT&T": { bg: "#e9f4ff", text: "#007cc3" },
    "Netflix": { bg: "#fdebec", text: "#e50914" },
    "Adobe": { bg: "#fdebec", text: "#ff0000" },
    "Salesforce": { bg: "#e6f2fb", text: "#009ddb" },
    "Oracle": { bg: "#fdebec", text: "#f80000" },
    "Intel": { bg: "#e6f2fb", text: "#0071c5" },
    "IBM": { bg: "#e8eaf6", text: "#006699" },
    "Pfizer": { bg: "#e6f2fb", text: "#0093d0" },
    "Walt Disney": { bg: "#e8eaf6", text: "#1a1f71" },
    "Comcast": { bg: "#f0f0f0", text: "#000000" },
    "Goldman Sachs": { bg: "#e7eefe", text: "#7399c6" },
    "Morgan Stanley": { bg: "#e8eaf6", text: "#003e6e" },
    "Wells Fargo": { bg: "#fdebec", text: "#d71e28" },
    "Citigroup": { bg: "#e6f2fb", text: "#004a9c" },
    "American Express": { bg: "#e6f2fb", text: "#006fcf" },
    "Blackstone": { bg: "#f0f0f0", text: "#000000" },
    "Lockheed Martin": { bg: "#e6f2fb", text: "#005a9c" },
    "Boeing": { bg: "#e6f2fb", text: "#0039a6" },
    "General Electric": { bg: "#e6f2fb", text: "#00609f" },
    "3M": { bg: "#fdebec", text: "#ff0000" },
    "Caterpillar": { bg: "#fef7e0", text: "#ffc800" },
    "Deere": { bg: "#eaf7e8", text: "#367c2b" },

    "Ford": { bg: "#e6f2fb", text: "#003478" },
    "General Motors": { bg: "#e6f2fb", text: "#004b93" },
    "McKinsey": { bg: "#e6f2fb", text: "#005f9e" },
    "BCG": { bg: "#e6f5e6", text: "#008a3a" },
    "Bain": { bg: "#fdebec", text: "#d00000" },
    "Deloitte": { bg: "#eaf7e8", text: "#86bc25" },
    "PwC": { bg: "#fff3e0", text: "#d04a02" },
    "EY": { bg: "#fef7e0", text: "#000000" },
    "KPMG": { bg: "#e6f2fb", text: "#00338d" },
    "Accenture": { bg: "#f4eaf7", text: "#a100ff" },
    "Two Sigma": { bg: "#f0f0f0", text: "#000000" },
    "Citadel": { bg: "#e6f5f5", text: "#006878" },
    "Renaissance Technologies": { bg: "#e6f2fb", text: "#005a9c" },
    "D.E. Shaw": { bg: "#eaf7e8", text: "#008000" },
    "Bridgewater": { bg: "#e6f2fb", text: "#0066a3" },
    "AQR": { bg: "#f0f0f0", text: "#000000" },
    "Millennium Management": { bg: "#e6f2fb", text: "#004b93" },
    "Point72": { bg: "#f0f0f0", text: "#000000" },
    "Jane Street": { bg: "#eaf7e8", text: "#008000" },
    "Jump Trading": { bg: "#fdebec", text: "#d91f2a" },
    "Virtu Financial": { bg: "#eaf7e8", text: "#78be20" },
    "OpenAI": { bg: "#eaf7e8", text: "#4c4c4c" },
    "Anthropic": { bg: "#f9f1e7", text: "#d16a24" },
    "DeepMind": { bg: "#f0f0f0", text: "#000000" },
    "Palantir": { bg: "#f0f0f0", text: "#000000" },
    "Palantir Technologies": { bg: "#f0f0f0", text: "#000000" },
    "Stripe": { bg: "#f4eaf7", text: "#6772e5" },
    "SpaceX": { bg: "#f0f0f0", text: "#000000" },
    "ByteDance": { bg: "#f0f0f0", text: "#000000" },
    "Uber": { bg: "#374151", text: "#ffffff" },
    "Airbnb": { bg: "#fdebec", text: "#ff5a5f" },
    "Snowflake": { bg: "#e9faff", text: "#29b5e8" },
    "Databricks": { bg: "#fdebec", text: "#ff3621" },
    "Canva": { bg: "#e8e6ff", text: "#8d33ff" },
    "Figma": { bg: "#fdebec", text: "#f24e1e" },
    "Notion": { bg: "#f0f0f0", text: "#333333" },
    "Discord": { bg: "#eef0fe", text: "#5865f2" },
    "Slack": { bg: "#e6f5eb", text: "#4a154b" },
    "Zoom": { bg: "#e9f4ff", text: "#2d8cff" },
    "Shopify": { bg: "#eaf7e8", text: "#96bf48" },
    "Square": { bg: "#e6f2fb", text: "#0066ff" },
    "Robinhood": { bg: "#eaf7e8", text: "#00c805" },
    "Coinbase": { bg: "#e6f2fb", text: "#0052ff" },
    "Ripple": { bg: "#e6f2fb", text: "#0073b7" },
    "Chainlink": { bg: "#e6f2fb", text: "#2a5ada" },
    "Amgen": { bg: "#e6f2fb", text: "#005a9c" },
    
    // New companies
    "PayPal": { bg: "#e6f2fb", text: "#003087" },
    "Zillow Group": { bg: "#fdebec", text: "#e31b23" },
    "TikTok": { bg: "#374151", text: "#ffffff" },
    "Atlassian": { bg: "#e6f2fb", text: "#0052cc" },
    "Vimeo": { bg: "#e6f2fb", text: "#1ab7ea" },
    "Dropbox": { bg: "#e6f2fb", text: "#0061ff" },
    "Inogen": { bg: "#e6f2fb", text: "#0066cc" },
    "Gucci": { bg: "#f0f0f0", text: "#000000" },
    "Facebook": { bg: "#e8eaf6", text: "#1877f2" },
    "DoorDash": { bg: "#fdebec", text: "#ff3008" },
    "Electronic Arts (EA)": { bg: "#f0f0f0", text: "#000000" },
    "Pure Storage": { bg: "#e6f2fb", text: "#0066cc" },
    "Pacific Western Bank": { bg: "#e6f2fb", text: "#0066cc" },
    "Charles Schwab": { bg: "#e6f2fb", text: "#0066cc" },
    "City National Bank": { bg: "#e6f2fb", text: "#0066cc" },
    "Stealth": { bg: "#374151", text: "#ffffff" },
    "Intuit": { bg: "#e6f2fb", text: "#0066cc" },
    "Moss Adams": { bg: "#e6f2fb", text: "#0066cc" },
    "Chase": { bg: "#e6f5f5", text: "#00958f" },
    "Workday": { bg: "#e6f2fb", text: "#f38b00" },
    "Paraform": { bg: "#000000", text: "#ffffff" },
  };
  
  const genericColor: CompanyColor = { bg: "#e5e7eb", text: "#4b5563" }; // gray-200, gray-600
  
  export function getCompanyColor(companyName?: string | null): CompanyColor {
    if (!companyName) {
      return genericColor;
    }
  
    const found = Object.keys(companyColors).find(key => 
      companyName.toLowerCase().includes(key.toLowerCase())
    );
  
    return found ? companyColors[found] : genericColor;
  } 