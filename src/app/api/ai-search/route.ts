import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()
  const prompt = `You are a search query parser for an alumni database. Extract search criteria from the user's query and return a JSON object with the following fields:
- role: array of strings or null (e.g., ["Software Engineer", "Senior Software Engineer", "Lead Software Engineer"])
- location: array of strings (e.g., ["San Francisco, CA", "New York, NY"])
- graduation_year_min: number or null (e.g., 2015)
- graduation_year_max: number or null (e.g., ${currentYear})
- family_branch: string or null (e.g., "Lambda", "Gamma")
- companies: array of strings or null (e.g., ["Google", "Microsoft"])

Important industry mapping rules:
1. When an industry is mentioned (e.g., "finance", "technology", "consulting"), map it to relevant companies
2. For finance industry, include: ["Goldman Sachs", "JPMorgan", "Morgan Stanley", "Citigroup", "Bank of America", "Wells Fargo", "BlackRock", "Vanguard", "Fidelity", "Charles Schwab"]
3. For technology industry, include: ["Google", "Apple", "Meta", "Microsoft", "Amazon", "Netflix", "Tesla", "NVIDIA", "Salesforce", "Adobe", "Oracle", "Intel", "AMD", "Cisco", "IBM"]
4. For consulting industry, include: ["McKinsey", "Bain", "BCG", "Deloitte", "PwC", "EY", "KPMG", "Accenture", "Strategy&", "Oliver Wyman"]
5. For healthcare industry, include: ["Johnson & Johnson", "Pfizer", "Moderna", "UnitedHealth Group", "Anthem", "Cigna", "CVS Health", "Walgreens", "Amgen", "Gilead Sciences"]
6. For marketing industry, include: ["WPP", "Omnicom", "Publicis", "Interpublic", "Dentsu", "Havas", "Accenture Interactive", "Deloitte Digital"]

Important company grouping mappings:
1. FAANG: ["Meta", "Apple", "Amazon", "Netflix", "Google"]
2. MAMAA: ["Meta", "Apple", "Microsoft", "Amazon", "Google"]
3. Big 4 (Accounting): ["Deloitte", "PwC", "EY", "KPMG"]
4. Big 3 (Consulting) / MBB: ["McKinsey", "BCG", "Bain"]
5. Quant firms: ["Jane Street", "Citadel", "Two Sigma", "DE Shaw", "Jump Trading"]
6. Bulge Bracket (Investment Banks): ["Goldman Sachs", "Morgan Stanley", "JPMorgan", "Bank of America", "Citigroup", "Barclays", "UBS"]
7. Tiger Cubs (Hedge Funds): ["Lone Pine", "Maverick", "Coatue", "Viking", "Tiger Global"]
8. Big Tech / Cloud Providers: ["Amazon", "Microsoft", "Google", "Meta", "Apple"]
9. Top FinTechs: ["Stripe", "Plaid", "Chime", "Robinhood", "Brex"]
10. Top SaaS / Cloud Software: ["Salesforce", "ServiceNow", "Snowflake", "Datadog", "Twilio"]
11. Big Oil: ["ExxonMobil", "Chevron", "Shell", "BP", "TotalEnergies", "ConocoPhillips"]
12. Big Pharma: ["Pfizer", "Johnson & Johnson", "Roche", "Novartis", "Merck", "AbbVie"]
13. Big 3 (Automakers): ["General Motors", "Ford", "Stellantis"]
14. Streaming Giants: ["Netflix", "Disney", "Amazon", "Hulu", "HBO"]
15. Semiconductor Leaders: ["TSMC", "NVIDIA", "Intel", "AMD", "Qualcomm", "Broadcom"]
16. Telecom Big 3: ["Verizon", "AT&T", "T-Mobile"]
17. Payment Processors: ["Visa", "Mastercard", "PayPal", "Square", "American Express"]
18. Big 4 (Airlines): ["American Airlines", "Delta", "United Airlines", "Southwest"]
19. FAAAM (Alternative): ["Meta", "Apple", "Amazon", "Google", "Microsoft"]
20. Unicorns (Recent IPOs): ["Airbnb", "DoorDash", "Coinbase", "Snowflake", "Palantir"]

When users mention these groupings, map them to the corresponding companies. For example:
- "FAANG companies" → companies: ["Meta", "Apple", "Amazon", "Netflix", "Google"]
- "Big 3 consulting" or "MBB" → companies: ["McKinsey", "BCG", "Bain"]
- "Big 4 accounting" → companies: ["Deloitte", "PwC", "EY", "KPMG"]
- "Bulge bracket banks" → companies: ["Goldman Sachs", "Morgan Stanley", "JPMorgan", "Bank of America", "Citigroup", "Barclays", "UBS"]

Important role handling rules:
1. When a general role is mentioned (e.g., "consulting"), include all variations of that role
2. For consulting roles, include: Consultant, Senior Consultant, Lead Consultant, Principal Consultant, Managing Consultant, Strategy Consultant, Management Consultant, Business Consultant, Technology Consultant, Implementation Consultant
3. For engineering roles, include: Engineer, Senior Engineer, Lead Engineer, Principal Engineer, Staff Engineer, Software Engineer, Data Engineer, DevOps Engineer, Systems Engineer, Cloud Engineer, Machine Learning Engineer, AI Engineer
4. For management roles, include: Manager, Senior Manager, Director, VP, C-level, Project Manager, Program Manager, Product Manager, Engineering Manager, Technical Manager, Operations Manager, Business Manager
5. For analyst roles, include: Analyst, Senior Analyst, Lead Analyst, Principal Analyst, Business Analyst, Data Analyst, Financial Analyst, Investment Analyst, Market Analyst, Research Analyst, Strategy Analyst
6. For finance roles, include: Financial Analyst, Investment Banker, Portfolio Manager, Risk Analyst, Credit Analyst, Financial Advisor, Investment Advisor, Wealth Manager, Financial Consultant, Banking Associate, Banking Analyst
7. For product roles, include: Product Manager, Senior Product Manager, Product Director, Product Lead, Product Owner, Technical Product Manager, Product Analyst, Product Strategist
8. For marketing roles, include: Marketing Manager, Marketing Director, Brand Manager, Digital Marketing Manager, Marketing Analyst, Marketing Specialist, Growth Manager, Marketing Strategist
9. For sales roles, include: Sales Representative, Account Executive, Sales Manager, Business Development Manager, Sales Director, Account Manager, Sales Operations Manager, Sales Analyst
10. For operations roles, include: Operations Manager, Operations Director, Supply Chain Manager, Logistics Manager, Process Manager, Operations Analyst, Business Operations Manager
11. For strategy roles, include: Strategy Manager, Strategy Director, Strategic Planner, Business Strategist, Corporate Strategy Manager, Strategic Initiatives Manager
12. For entrepreneurship roles, include: Founder, Co-Founder, CEO, CTO, COO, Entrepreneur, Startup Founder, Business Owner

Important location handling rules:
1. Always return city-level locations with state (e.g., "San Francisco, CA")
2. If a state is mentioned (e.g., "California"), return all major cities in that state
3. If a region is mentioned (e.g., "Bay Area"), return all cities in that region
4. If a city is mentioned without state, add the state (e.g., "San Francisco" → "San Francisco, CA")

Example input: "find software engineers in California who graduated after 2015"
Example output: {
  "role": ["Software Engineer", "Senior Software Engineer", "Lead Software Engineer", "Principal Software Engineer", "Staff Software Engineer"],
  "location": ["San Francisco, CA", "Los Angeles, CA", "San Diego, CA", "San Jose, CA", "Oakland, CA", "Cupertino, CA", "Sunnyvale, CA", "Sacramento, CA"],
  "graduation_year_min": 2015,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": null
}

Example input: "people in consulting in San Francisco"
Example output: {
  "role": ["Consultant", "Senior Consultant", "Lead Consultant", "Principal Consultant", "Managing Consultant", "Strategy Consultant", "Management Consultant", "Business Consultant", "Technology Consultant", "Implementation Consultant"],
  "location": ["San Francisco, CA"],
  "graduation_year_min": null,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": ["McKinsey", "Bain", "BCG", "Deloitte", "PwC", "EY", "KPMG", "Accenture", "Strategy&", "Oliver Wyman"]
}

Example input: "finance professionals in New York"
Example output: {
  "role": ["Financial Analyst", "Investment Banker", "Portfolio Manager", "Risk Analyst", "Credit Analyst", "Financial Advisor", "Investment Advisor", "Wealth Manager", "Financial Consultant", "Banking Associate", "Banking Analyst"],
  "location": ["New York, NY"],
  "graduation_year_min": null,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": ["Goldman Sachs", "JPMorgan", "Morgan Stanley", "Citigroup", "Bank of America", "Wells Fargo", "BlackRock", "Vanguard", "Fidelity", "Charles Schwab"]
}

Example input: "tech workers in San Francisco and Los Angeles"
Example output: {
  "role": null,
  "location": ["San Francisco, CA", "Los Angeles, CA"],
  "graduation_year_min": null,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": ["Google", "Apple", "Meta", "Microsoft", "Amazon", "Netflix", "Tesla", "NVIDIA", "Salesforce", "Adobe", "Oracle", "Intel", "AMD", "Cisco", "IBM"]
}

Example input: "people at FAANG companies"
Example output: {
  "role": null,
  "location": null,
  "graduation_year_min": null,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": ["Meta", "Apple", "Amazon", "Netflix", "Google"]
}

Example input: "Big 3 consultants in New York"
Example output: {
  "role": ["Consultant", "Senior Consultant", "Lead Consultant", "Principal Consultant", "Managing Consultant", "Strategy Consultant", "Management Consultant", "Business Consultant", "Technology Consultant", "Implementation Consultant"],
  "location": ["New York, NY"],
  "graduation_year_min": null,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": ["McKinsey", "BCG", "Bain"]
}

Example input: "quant traders at Jane Street"
Example output: {
  "role": ["Quantitative Trader", "Quantitative Analyst", "Quantitative Researcher", "Quantitative Developer", "Algorithmic Trader"],
  "location": null,
  "graduation_year_min": null,
  "graduation_year_max": null,
  "family_branch": null,
  "companies": ["Jane Street"]
}

Query: "${query}"
JSON:`

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that extracts structured alumni search filters from natural language. Always return valid JSON with the exact fields specified.' 
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 256,
    }),
  })

  if (!openaiRes.ok) {
    const errorText = await openaiRes.text()
    console.error('OpenAI API error:', errorText)
    return NextResponse.json({ error: 'OpenAI API error', details: errorText }, { status: 500 })
  }

  const data = await openaiRes.json()
  console.log('OpenAI raw response:', data)
  const text = data.choices?.[0]?.message?.content?.trim()
  let filters = null
  try {
    filters = JSON.parse(text)
  } catch {
    console.error('Failed to parse AI response:', text)
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
  }

  return NextResponse.json({ filters })
} 