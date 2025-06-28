# AKPsi Alumni Network (FAN)

A modern, searchable directory of Alpha Kappa Psi alumni that displays career and fraternal information through an intuitive interface. Built with Next.js, Supabase, and AI-powered search capabilities.

## 🎯 Overview

The Fraternal Alumni Network (FAN) is a comprehensive platform that:
- **Centralizes alumni data** from multiple sources and spreadsheets
- **Enriches profiles** using LinkedIn scraping and manual verification
- **Enables powerful search** with natural language queries via OpenAI
- **Visualizes connections** through interactive family trees
- **Provides filtering** by industry, company, location, graduation year, and more

## ✨ Features

### 🔍 Advanced Search & Filtering
- **Natural Language Search**: Use conversational queries like "Show finance people in Lambda who graduated after 2020"
- **AI-Powered Filtering**: OpenAI integration converts natural language to structured filters
- **Manual Filters**: Filter by company, role, city, graduation year, and profile completeness
- **Real-time Results**: Instant search results with pagination

### 👥 Alumni Profiles
- **Rich Profile Cards**: Display name, role, companies, location, and bio
- **LinkedIn Integration**: Automatic data enrichment from LinkedIn profiles
- **Career History**: Detailed work experience and company information
- **Profile Pictures**: LinkedIn profile photos when available

### 🌳 Family Tree Visualization
- **Interactive Family Trees**: Visualize fraternal relationships using D3.js
- **Big Brother/Little Brother Connections**: Track mentorship relationships
- **Family Branch Organization**: Group by fraternity chapters (Lambda, Omega, etc.)

### 🔧 Admin Features
- **Data Management**: Upload and manage alumni spreadsheets
- **Manual Verification**: Verify and edit alumni information
- **LinkedIn Scraping**: Automated profile data collection
- **Backup System**: Automatic data backups before updates

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern component library
- **Framer Motion** - Smooth animations
- **D3.js** - Data visualization for family trees

### Backend
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - Authentication and authorization
- **Edge Functions** - Serverless API endpoints

### AI & Data
- **OpenAI API** - Natural language processing for search
- **Puppeteer** - LinkedIn web scraping
- **Puppeteer Extra** - Enhanced scraping with stealth mode

### Deployment
- **Vercel** - Hosting and deployment
- **Vercel Analytics** - Performance monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- OpenAI API key
- LinkedIn credentials (for scraping)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd akpsi-alumni
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # LinkedIn (for scraping)
   LINKEDIN_EMAIL=your_linkedin_email
   LINKEDIN_PASSWORD=your_linkedin_password
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see `supabase/` directory)
   - Configure authentication settings

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Data Management
npm run scrape       # Run LinkedIn scraper
npm run scrape:watch # Run scraper in watch mode
npm run backup       # Create database backup
```

## 🗄️ Database Schema

The main `alumni` table includes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique alumni ID |
| `name` | TEXT | Full name |
| `linkedin_url` | TEXT | LinkedIn profile URL |
| `picture_url` | TEXT | Profile picture URL |
| `bio` | TEXT | Professional bio |
| `role` | TEXT | Current role |
| `companies` | TEXT[] | List of companies |
| `career_history` | JSONB | Detailed work experience |
| `family_branch` | TEXT | Fraternity chapter |
| `graduation_year` | INT | Graduation year |
| `location` | TEXT | Current location |
| `has_linkedin` | BOOLEAN | Has LinkedIn profile |
| `scraped` | BOOLEAN | Data scraped from LinkedIn |
| `has_enrichment` | BOOLEAN | AI-enriched data |
| `manually_verified` | BOOLEAN | Admin-verified |

## 🔧 Configuration

### LinkedIn Scraping
The scraping system uses Puppeteer with stealth mode to collect LinkedIn data:

```bash
# Test scraping with specific profiles
npm run scrape

# Scrape all unscraped profiles in database
# (Uncomment relevant section in scripts/scrape-linkedin.ts)
```

### AI Search Configuration
Natural language search is powered by OpenAI's GPT models. Configure in your environment variables and adjust prompts in the AI search components.

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Ensure all environment variables are set in your Vercel project settings.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary to Alpha Kappa Psi.

## 👨‍💻 Author

**Cameron Byrne** - *Initial work* - [LinkedIn](https://www.linkedin.com/in/cameronbyrne00)

## 🙏 Acknowledgments

- Alpha Kappa Psi fraternity for the opportunity
- Next.js and Vercel for the excellent development experience
- Supabase for the powerful backend infrastructure
- OpenAI for AI-powered search capabilities
