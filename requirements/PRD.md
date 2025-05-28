PRD:
Here's a Product Requirements Document (PRD) for your alumni project using:
Frontend: Next.js + Shadcn UI (v0)


Backend: Supabase (PostgreSQL DB, Auth, Edge Functions)


Deployment: Vercel


Extras: OpenAI API for natural language filtering, LinkedIn scraping for enrichment



📄 Product Requirements Document
Project Name: Fraternal Alumni Network (FAN)
 Owner: Cameron Byrne
 Tech Stack: Next.js, Shadcn UI (v0), Supabase, OpenAI API, Vercel

🧭 Overview
Build a searchable, filterable directory of Alpha Kappa Psi alumni that displays relevant career and fraternal information via a sleek, modern interface. Data comes from spreadsheets and LinkedIn enrichment, and is visualized in interactive cards and family trees.

🎯 Goals
Create a centralized alumni database from multiple spreadsheets


Enrich data using LinkedIn (scraped or manually matched)


Display alumni in card format with hover/click bio


Enable filtering by industry, company, family branch, graduation year, location, and more


Allow natural language search via OpenAI


Visualize fraternal family trees using graph view



🏗️ Architecture
🧱 Frontend
Framework: Next.js (App Router, server components)


UI Kit: Shadcn UI with v0 components


Design:


Card component with name, picture, role, companies (bio on hover/click)


SearchBar with natural language search


FilterPanel (Dropdowns, sliders, badges)


FamilyTreePage using D3.js or similar


🌐 Backend
Supabase DB (PostgreSQL)


Stores all alumni info


Edge functions for querying filtered search


Supabase Auth


For admin login (data upload, verification)


🧠 AI Integration
OpenAI API


Converts user natural language search to JSON filter object


Example:

 "Show finance people in Lambda who graduated after 2020" 
→ {
  "industry": "Finance",
  "family_branch": "Lambda",
  "graduation_year_min": 2020
}


☁️ Deployment
Vercel: Instant deploy, Next.js optimization, Supabase integration



📚 Features
✅ MVP (Phase 1)
Upload and parse multiple Excel spreadsheets to Supabase


Normalize alumni objects in database


Display alumni cards from Supabase


Hover/click to show bio


Manual or LinkedIn-enriched data population


Basic filters (industry, family, year, company)


Natural language → filters (OpenAI)


Mobile responsive


🚀 Phase 2
Admin dashboard for data uploads + manual edits


Family tree visualization page


Scraping engine for LinkedIn data


Auth-gated view (only AKPsi members)



📁 Supabase Table Schema (alumni)
Column
Type
Notes
id
UUID (PK)
Unique alumni ID
name
TEXT
Full name
linkedin_url
TEXT
Optional
picture_url
TEXT
Optional
bio
TEXT
Optional
role
TEXT
Most recent role
companies
TEXT[]
List of companies
industry
TEXT
Industry category
big_brother
TEXT
Full name
little_brothers
TEXT[]
List of names
family_branch
TEXT
e.g. Lambda, Omega
graduation_year
INT
e.g. 2022
location
TEXT
City, State
has_linkedin
BOOLEAN
True/False
scraped
BOOLEAN
Indicates if info was scraped
manually_verified
BOOLEAN
Admin-verified info
source_sheet
TEXT
Origin of entry
created_at
TIMESTAMP
Supabase default


🧪 Example UI Flow
Home Page:
 Displays 20 alumni cards, filter bar at the top, search bar above that.


User Types:
 "Show tech people in Gamma who worked at Google"


OpenAI Converts Query → Filters Supabase via RPC function:

 {
  "industry": "Tech",
  "family_branch": "Gamma",
  "companies": ["Google"]
}


Results displayed with clean animations.


User hovers card → Bio fades in with smooth transition.



📈 KPIs
Time to first result (TTFR): < 1.5s


Accuracy of AI-filter matching: > 90%


Manual verification completion rate: > 80%


LinkedIn enrichment coverage: > 75% of entries



🛠 Tools
Tool
Purpose
Next.js
Fullstack app framework
Shadcn UI v0
UI Components
Supabase
DB, API, Auth
Vercel
Hosting + deployment
OpenAI API
NLP filter translation
D3.js or Cytoscape
Family tree visualization
xlsx, papaparse
Spreadsheet upload/parser

