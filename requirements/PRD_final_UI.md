# Alumnow UI Enhancement Implementation Guide

## Project Structure Context
- Next.js project with TypeScript
- Components likely in `/components/` or `/src/components/`
- Styles using CSS modules or Tailwind
- Environment variables in `.env.local`

---

## Task 1: Brand Header Update
**Files to modify**: Header component, environment configuration

### Step 1.1: Add Environment Variables
```bash
# Add to .env.local
ORGANIZATION_NAME="Alpha Kappa Psi at UCSB"
ORGANIZATION_SUBTITLE="UCSB Chapter"
```

### Step 1.2: Update Header Component
**Find**: Main header component (likely `Header.tsx`, `Navbar.tsx`, or similar)
**Replace**: Current header text with:
```tsx
<h1 className="main-header">Alumnow</h1>
<p className="org-subtitle">{process.env.ORGANIZATION_NAME}</p>
```

**Verification**: Header shows "Alumnow" with subtitle below

---

## Task 2: Create Blue Glow CSS System
**Files to create/modify**: Global CSS or Tailwind config

### Step 2.1: Add Blue Glow Utilities
**Create**: `/styles/glow-effects.css` or add to existing CSS:
```css
.blue-glow {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: box-shadow 0.3s ease;
}

.blue-glow:hover {
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.7);
}

.card-glow {
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.card-glow:hover {
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.25);
  transform: translateY(-2px);
}
```

### Step 2.2: Apply Glow to Cards
**Find**: Alumni card component
**Add**: `card-glow` class to card wrapper div

---

## Task 3: Slow Down Typewriter Animation
**Files to modify**: Typewriter component

### Step 3.1: Find Typewriter Component
**Search for**: "Connecting brothers" text or typewriter animation
**Look for**: `setInterval`, `setTimeout`, or animation timing

### Step 3.2: Adjust Timing
**Find**: Animation speed parameter (likely 50-100ms)
**Change to**: 150-200ms for slower effect
```javascript
// Change from:
const typingSpeed = 100;
// To:
const typingSpeed = 180;
```

---

## Task 4: Contact Icons System
**Files to modify**: Alumni card component

### Step 4.1: Install Icons (if not already available)
```bash
npm install lucide-react
# or
npm install react-icons
```

### Step 4.2: Create Contact Icons Component
**Create**: `/components/ContactIcons.tsx`
```tsx
import { Mail, Phone, Linkedin } from 'lucide-react';

interface ContactIconsProps {
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedin: boolean;
}

export function ContactIcons({ hasEmail, hasPhone, hasLinkedin }: ContactIconsProps) {
  return (
    <div className="flex gap-2">
      {hasEmail && <Mail className="w-4 h-4 text-blue-500" />}
      {hasPhone && <Phone className="w-4 h-4 text-green-500" />}
      {hasLinkedin && <Linkedin className="w-4 h-4 text-orange-500" />}
    </div>
  );
}
```

### Step 4.3: Update Alumni Card
**Find**: Alumni card component
**Replace**: Text-based contact info with:
```tsx
<ContactIcons 
  hasEmail={!!alumni.email}
  hasPhone={!!alumni.phone}
  hasLinkedin={!!alumni.linkedin}
/>
```

---

## Task 5: Alumni Card Visual Hierarchy Redesign
**Files to modify**: Alumni card component and styles

### Step 5.1: Update Card Layout
**Find**: Alumni card JSX structure
**Replace with**: New hierarchy structure:
```tsx
<div className="alumni-card card-glow">
  <div className="card-header">
    <h3 className="alumni-name">{alumni.name}</h3>
    <ContactIcons hasEmail={!!alumni.email} hasPhone={!!alumni.phone} hasLinkedin={!!alumni.linkedin} />
  </div>
  
  <div className="card-primary">
    <p className="current-role">
      <span className="title">{alumni.currentTitle}</span>
      <span className="company-separator"> @ </span>
      <span className="company">{alumni.currentCompany}</span>
    </p>
  </div>
  
  <div className="card-secondary">
    <span className="location">{alumni.location}</span>
    <span className="class-year">Class of {alumni.classYear}</span>
  </div>
  
  {alumni.experience && (
    <div className="card-tertiary">
      <p className="experience">{alumni.experience}</p>
    </div>
  )}
</div>
```

### Step 5.2: Add Card Styles
**Create/Update**: Card-specific CSS:
```css
.alumni-card {
  padding: 20px;
  background: white;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alumni-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.card-primary {
  margin-bottom: 8px;
}

.current-role {
  font-size: 1rem;
  margin: 0;
}

.title {
  font-weight: 600;
  color: #374151;
}

.company {
  font-weight: 600;
  color: #2563eb;
}

.company-separator {
  color: #6b7280;
  font-weight: 400;
}

.card-secondary {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.location {
  color: #059669;
  font-weight: 500;
}

.class-year {
  color: #7c3aed;
  font-weight: 500;
}

.card-tertiary {
  font-size: 0.85rem;
  color: #6b7280;
}
```

---

## Task 6: Company Enhancement System
**Files to create**: Company data file and enhancement logic

### Step 6.1: Create Company Data File
**Create**: `/data/company-data.json`
```json
{
  "fortune500": [
    "Apple", "Microsoft", "Amazon", "Google", "Meta", "Tesla", "Netflix"
  ],
  "unicorns": [
    "Stripe", "SpaceX", "Canva", "Discord", "Figma", "Notion"
  ],
  "industries": {
    "tech": ["Apple", "Microsoft", "Google", "Meta", "Netflix"],
    "finance": ["JPMorgan", "Goldman Sachs", "Morgan Stanley"],
    "healthcare": ["Johnson & Johnson", "Pfizer", "UnitedHealth"],
    "consulting": ["McKinsey", "BCG", "Bain", "Deloitte", "PwC"]
  },
  "colors": {
    "fortune500": "#fbbf24",
    "unicorn": "#a855f7", 
    "tech": "#3b82f6",
    "finance": "#10b981",
    "healthcare": "#ef4444",
    "consulting": "#f97316"
  }
}
```

### Step 6.2: Create Company Enhancement Hook
**Create**: `/hooks/useCompanyEnhancement.ts`
```typescript
import companyData from '../data/company-data.json';

export function useCompanyEnhancement(companyName: string) {
  if (!companyName) return { color: null, badge: null };
  
  const name = companyName.toLowerCase();
  
  // Check Fortune 500
  if (companyData.fortune500.some(company => 
    name.includes(company.toLowerCase())
  )) {
    return { color: companyData.colors.fortune500, badge: 'Fortune 500' };
  }
  
  // Check Unicorns
  if (companyData.unicorns.some(company => 
    name.includes(company.toLowerCase())
  )) {
    return { color: companyData.colors.unicorn, badge: 'Unicorn' };
  }
  
  // Check Industry
  for (const [industry, companies] of Object.entries(companyData.industries)) {
    if (companies.some(company => 
      name.includes(company.toLowerCase())
    )) {
      return { color: companyData.colors[industry], badge: null };
    }
  }
  
  return { color: null, badge: null };
}
```

### Step 6.3: Apply Company Enhancement
**Update**: Alumni card component to use enhancement:
```tsx
import { useCompanyEnhancement } from '../hooks/useCompanyEnhancement';

// Inside component:
const { color, badge } = useCompanyEnhancement(alumni.currentCompany);

// Update company span:
<span 
  className="company" 
  style={{ color: color || '#2563eb' }}
>
  {alumni.currentCompany}
  {badge && <span className="company-badge">{badge}</span>}
</span>
```

---

## Task 7: Disable Background Paths During Search
**Files to modify**: Search component and background component

### Step 7.1: Add Search State Context
**Find**: Search/filter component
**Add**: State management for active search:
```tsx
const [isSearchActive, setIsSearchActive] = useState(false);

// Update search handler:
const handleSearchChange = (value: string) => {
  setIsSearchActive(value.length > 0);
  // existing search logic
};
```

### Step 7.2: Conditionally Render Background
**Find**: Background paths component
**Wrap with**: Conditional rendering:
```tsx
{!isSearchActive && <BackgroundPaths />}
```

---

## Task 8: Family Tree Full View on Load
**Files to modify**: Family tree component

### Step 8.1: Update Tree Initial State
**Find**: Family tree component initialization
**Change**: Default zoom/view to show full tree:
```tsx
// Change initial zoom/scale to fit full tree
const initialScale = 0.5; // or whatever fits full tree
const initialPosition = { x: centerX, y: centerY };

// Add initial render effect:
useEffect(() => {
  // Calculate bounds to show full tree
  fitTreeToView();
}, [treeData]);
```

### Step 8.2: Add Zoom Prompt
**Add**: User guidance after initial load:
```tsx
const [showZoomHint, setShowZoomHint] = useState(true);

// Add hint overlay:
{showZoomHint && (
  <div className="zoom-hint-overlay">
    <p>Zoom in to explore connections in detail</p>
    <button onClick={() => setShowZoomHint(false)}>Got it</button>
  </div>
)}
```

---

## Verification Checklist
After each task:
- [ ] Component renders without errors
- [ ] Styles apply correctly
- [ ] Functionality works as expected
- [ ] No TypeScript errors


## Testing Commands
```bash
npm run dev          # Start development server
npm run build        # Test build process  
npm run type-check   # Check TypeScript (if available)
```

## Implementation Order
1. Task 2 (CSS system) - Foundation for other changes
2. Task 1 (Header) - Quick visible change
3. Task 3 (Animation) - Simple timing adjustment  
4. Task 4 (Icons) - Prepare for card redesign
5. Task 5 (Card redesign) - Major visual update
6. Task 6 (Company enhancement) - Data-driven improvements
7. Task 7 (Background paths) - Search interaction
8. Task 8 (Family tree) - UX enhancement