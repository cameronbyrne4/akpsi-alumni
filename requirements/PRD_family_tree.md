# Fraternity Family Tree Visualization - PRD

## Overview
Create an interactive family tree visualization page for the fraternity alumni database, displaying hierarchical big/little relationships within each family branch.

## User Stories
- As a user, I want to select different family trees from a dropdown to view their hierarchical structure
- As a user, I want to see members connected in a top-down tree format with organic connecting lines
- As a user, I want to hover over nodes to see them enlarge with smooth animations
- As a user, I want to zoom in/out of the tree like a map interface for better navigation

## Technical Requirements

### Data Structure
- **Source**: Supabase alumni database
- **Key Fields**:
  - `big_brother` (text) - Reference to parent node
  - `little_brothers` (text[]) - Array of child node references  
  - `family_branch` (text) - Family tree identifier
- **Data Filtering**: Only include members where `family_branch` matches one of the 9 valid families (not null/invalid)

### Family Trees
Nine selectable family branches:
- Paahana
- Magpantay  
- Brecek
- Brugos
- Cauntay
- Johnson
- Chou
- Heller
- Li

### UI Components

#### Family Selector
- Dropdown menu using shadcn Select component
- Consistent styling with existing alumni search page
- Default to first family tree on page load

#### Tree Visualization
- **Layout**: Top-down hierarchical structure
- **Nodes**: Circular elements displaying member names
- **Connections**: Organic/curved lines between big/little relationships
- **Root**: Founder(s) at top (members with no `big_brother`)
- **Branches**: Each member can have 0-3 littles maximum

### Interactions

#### Hover Effects
- Node enlargement on hover with smooth CSS transitions
- Background dimming effect during hover
- Maintain smooth animations throughout

#### Zoom/Pan Controls  
- Mouse wheel scrolling for zoom in/out functionality
- Click-and-drag panning across the tree canvas
- Map-like navigation experience
- Zoom controls should be intuitive and responsive

### Technical Implementation

#### Recommended Libraries
- **D3.js** or **vis.js** for tree layout and rendering
- **React** with existing shadcn components for UI consistency
- Leverage existing styling system and design tokens

#### Data Flow
1. Fetch alumni data from Supabase on component mount
2. Filter by selected family branch
3. Transform flat data structure into hierarchical tree
4. Render tree with selected visualization library
5. Apply interactions and styling

#### Performance Considerations
- Lazy load family data only when selected
- Implement efficient re-rendering on family changes
- Optimize for trees with varying sizes (some may be significantly larger)

## Design Requirements

### Visual Consistency
- Match existing alumni page styling, typography, and color scheme
- Use established shadcn component patterns
- Maintain consistent spacing and visual hierarchy

### Node Styling
- Circular node shape
- Display member name as text label
- No profile images (placeholder implementation)
- Consistent sizing with hover enlargement

### Responsive Design
- Mobile-friendly tree navigation
- Touch-friendly zoom/pan controls on mobile devices
- Responsive dropdown and controls

## Scope Limitations
- **Phase 1**: Basic tree visualization with family selection
- **Not Included**: 
  - Profile popup implementation (future enhancement)
  - Profile image integration (future enhancement)
  - Click interactions beyond hover effects

## Success Criteria
- All 9 family trees render correctly with proper hierarchical relationships
- Smooth hover animations and zoom/pan functionality
- Dropdown family selection works seamlessly
- Visual consistency with existing alumni search page
- Mobile-responsive implementation

## Future Enhancements
- Profile popup integration with alumni search page data
- Profile image support
- Advanced filtering and search within trees
- Export/sharing functionality