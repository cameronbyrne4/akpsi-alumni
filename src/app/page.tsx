'use client'

// --- Copied from src/app/(protected)/page.tsx ---
import { useEffect, useState, useRef } from 'react'
import { AlumniCard } from '@/components/ui/alumni-card'
import { SearchFilter } from '@/components/search-filter'
import { supabase } from '@/lib/supabase'
import type { Alumni } from '@/lib/supabase'
import { Loader2, X, Info } from 'lucide-react'
import { AiSearchBar } from '@/components/ai-search-bar'
import { useLayoutContext } from '@/components/client-layout-shell'
import { useRouter } from 'next/navigation'
import { Typewriter } from '@/components/ui/typewriter'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { BackgroundPaths } from '@/components/ui/background-paths'
import { motion, AnimatePresence } from 'framer-motion'
import { matchesCityFilter } from '@/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

const PAGE_SIZE = 21;

const examplePrompts = [
  "People working on the East Coast",
  "Managers for anything in finance",
  "Who works at a FAANG company?",
  "Consultants who graduated over 10 years ago",
  "Big 4 consultants in Los Angeles",
];

// Helper function to check if alumni has worked at any of the selected companies
const hasWorkedAtCompanies = (alum: Alumni, selectedCompanies: string[]): boolean => {
  if (!selectedCompanies.length) return true;
  
  const selectedCompaniesLower = selectedCompanies.map(c => c.toLowerCase());
  
  // Check companies array (manual data)
  if (alum.companies && alum.companies.length > 0) {
    for (const company of alum.companies) {
      if (selectedCompaniesLower.some(selected => 
        company.toLowerCase().includes(selected) || selected.includes(company.toLowerCase())
      )) {
        console.log(`✅ Company match in companies array: "${company}" matches "${selectedCompanies.join(', ')}" for ${alum.name}`);
        return true;
      }
    }
  }
  
  // Check career_history for enriched data
  if (alum.has_enrichment && alum.career_history && alum.career_history.length > 0) {
    for (const experience of alum.career_history) {
      if (experience.company_name && selectedCompaniesLower.some(selected => 
        experience.company_name.toLowerCase().includes(selected) || 
        selected.includes(experience.company_name.toLowerCase())
      )) {
        console.log(`✅ Company match in enriched career_history: "${experience.company_name}" matches "${selectedCompanies.join(', ')}" for ${alum.name}`);
        return true;
      }
    }
  }
  
  // Check career_history for scraped data
  if (alum.scraped && alum.career_history && alum.career_history.length > 0) {
    for (const history of alum.career_history) {
      // Handle scraped data structure with experiences array
      if ('experiences' in history && Array.isArray((history as any).experiences)) {
        const experiences = (history as any).experiences;
        for (const exp of experiences) {
          if (exp.company && selectedCompaniesLower.some(selected => 
            exp.company.toLowerCase().includes(selected) || 
            selected.includes(exp.company.toLowerCase())
          )) {
            console.log(`✅ Company match in scraped experiences: "${exp.company}" matches "${selectedCompanies.join(', ')}" for ${alum.name}`);
            return true;
          }
        }
      }
      
      // Handle direct company field in scraped data
      if ('company' in history && (history as any).company && selectedCompaniesLower.some(selected => 
        (history as any).company.toLowerCase().includes(selected) || 
        selected.includes((history as any).company.toLowerCase())
      )) {
        console.log(`✅ Company match in scraped direct company: "${(history as any).company}" matches "${selectedCompanies.join(', ')}" for ${alum.name}`);
        return true;
      }
    }
  }
  
  return false;
};

export default function Home() {
  const currentYear = new Date().getFullYear()
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    company: [] as string[],
    role: [] as string[],
    city: [] as string[],
    graduationYear: undefined as [number, number] | undefined,
    hasCompleteProfile: false,
  })
  // Cache for client-side filtered results
  const [filteredCache, setFilteredCache] = useState<Alumni[]>([])
  const [lastFilterHash, setLastFilterHash] = useState<string>('')
  const {
    manualSearchMode,
    setManualSearchMode,
    previousSearches,
    addPreviousSearch,
    selectPreviousSearch,
    registerPreviousSearchHandler,
  } = useLayoutContext()
  const [hasSearched, setHasSearched] = useState(false)
  const [aiQuery, setAiQuery] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiInputRef = useRef<string | null>(null)
  const router = useRouter()
  const [aiLocationCities, setAiLocationCities] = useState<{ label: string; value: string }[]>([])
  const [aiInputValue, setAiInputValue] = useState('');
  const [showPromptPopover, setShowPromptPopover] = useState(false);
  const promptLinkRef = useRef<HTMLButtonElement>(null);
  const manualFilterRef = useRef<HTMLDivElement>(null);
  const alumniListRef = useRef<HTMLDivElement>(null);

  // Track if search is active for background paths
  const isSearchActive = hasSearched || manualSearchMode;

  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  // Smooth scroll to manual filter when toggling
  useEffect(() => {
    if (manualSearchMode && manualFilterRef.current) {
      setTimeout(() => {
        manualFilterRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100) // Small delay to ensure the element is rendered
    }
  }, [manualSearchMode])

  // Helper to build Supabase filter query
  const buildQuery = () => {
    console.log('🔍 Building query with:', { searchQuery, filters })
    let q = supabase.from('alumni').select('*', { count: 'exact' })
    
    // Has professional info - must be first filter
    if (filters.hasCompleteProfile) {
      console.log('Applying hasCompleteProfile filter')
      q = q.or(
        // Has LinkedIn data (scraped or enriched)
        'scraped.eq.true,has_enrichment.eq.true,' +
        // OR has LinkedIn URL (indicates they have a profile)
        'linkedin_url.not.is.null,' +
        // OR has meaningful professional information (not empty)
        'role.not.is.null,location.not.is.null'
      )
        // Exclude empty career history (null, empty array, or object with empty experiences)
        .not('career_history', 'is', null)
        .not('career_history', 'eq', '[]')
        .not('career_history', 'eq', '{"bio":null,"experiences":[],"picture_url":null}')
    }

    // Search - simple text search (this can still be done server-side for efficiency)
    if (searchQuery) {
      console.log('🔍 Adding search query:', searchQuery)
      q = q.or(`name.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%`)
    }
    
    // All other filtering will be done client-side for consistency
    console.log('🔍 All other filters will be applied client-side')
    
    console.log('🔍 Final query built')
    return q
  }

  const fetchAlumni = async (pageNum: number, reset = false) => {
    console.log('🚀 fetchAlumni called with:', { pageNum, reset, filters })
    setLoading(true)
    
    // Always use client-side filtering and pagination to ensure consistent results without duplicates
    // This is safer than trying to mix server-side and client-side pagination
    const needsClientSideFiltering = true;
    console.log('🔍 Using client-side filtering for consistent pagination')
    
    // Create a hash of current filters to check if we need to refetch
    const currentFilterHash = JSON.stringify({
      searchQuery,
      company: filters.company,
      role: filters.role,
      graduationYear: filters.graduationYear,
      hasCompleteProfile: filters.hasCompleteProfile,
      city: filters.city
    });
    
    // If we have client-side filtering and the cache is valid, use it
    // BUT only if we're not resetting (i.e., not changing pages or filters)
    if (!reset && lastFilterHash === currentFilterHash && filteredCache.length > 0) {
      console.log('🔍 Using cached filtered results')
      const startIndex = pageNum * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageData = filteredCache.slice(startIndex, endIndex);
      console.log('🔍 Page data from cache:', { startIndex, endIndex, pageDataLength: pageData.length, totalCacheLength: filteredCache.length })
      
      setAlumni(pageData);
      setTotalCount(filteredCache.length);
      setHasMore((pageNum + 1) * PAGE_SIZE < filteredCache.length);
      setLoading(false);
      return;
    }
    
    // If we're resetting or cache is invalid, clear it
    if (reset || lastFilterHash !== currentFilterHash) {
      console.log('🔍 Clearing cache due to reset or filter change')
      setFilteredCache([]);
      setLastFilterHash('');
    }
    
    let q = buildQuery()
    
    // Always fetch all data for client-side filtering and pagination
    console.log('🔍 Fetching ALL data for client-side filtering and pagination')
    q = q.order('created_at', { ascending: false })
    
    try {
      console.log('📡 Executing Supabase query...')
      const { data, error, count } = await q
      console.log('📡 Query result:', { dataLength: data?.length, error, count, pageNum })
      
      if (error) {
        console.error('❌ Error fetching alumni:', error)
        setLoading(false)
        return
      }

      // Apply all filtering client-side
      let filteredData = data || [];
      
      // Apply city filtering if needed
      if (filters.city.length > 0) {
        console.log('🔍 Applying city filters client-side:', filters.city)
        filteredData = filteredData.filter(alum => {
          const matches = filters.city.some(city => {
            const isMatch = matchesCityFilter(alum.location, city);
            if (isMatch) {
              console.log(`✅ Match: "${alum.location}" matches city filter "${city}"`);
            }
            return isMatch;
          });
          return matches;
        });
        console.log('🔍 After city filtering:', filteredData.length, 'results')
      }
      
      // Apply company filtering if needed
      if (filters.company.length > 0) {
        console.log('🔍 Applying company filter client-side:', filters.company)
        filteredData = filteredData.filter(alum => hasWorkedAtCompanies(alum, filters.company));
        console.log('🔍 After company filtering:', filteredData.length, 'results')
      }
      
      // Apply role filtering if needed
      if (filters.role.length > 0) {
        console.log('🔍 Applying role filter client-side:', filters.role)
        filteredData = filteredData.filter(alum => {
          return filters.role.some(role => 
            alum.role?.toLowerCase().includes(role.toLowerCase())
          );
        });
        console.log('🔍 After role filtering:', filteredData.length, 'results')
      }
      
      // Apply graduation year filtering if needed
      if (filters.graduationYear) {
        console.log('🔍 Applying graduation year filter client-side:', filters.graduationYear)
        const [minYear, maxYear] = filters.graduationYear;
        filteredData = filteredData.filter(alum => {
          return alum.graduation_year && alum.graduation_year >= minYear && alum.graduation_year <= maxYear;
        });
        console.log('🔍 After graduation year filtering:', filteredData.length, 'results')
      }
      
      // Apply hasCompleteProfile filtering if needed
      if (filters.hasCompleteProfile) {
        console.log('🔍 Applying hasCompleteProfile filter client-side')
        filteredData = filteredData.filter(alum => {
          return (
            alum.scraped === true ||
            alum.has_enrichment === true ||
            alum.linkedin_url ||
            (alum.role && alum.location) ||
            (alum.career_history && 
             Array.isArray(alum.career_history) && 
             alum.career_history.length > 0 &&
             !(alum.career_history.length === 1 && 
               typeof alum.career_history[0] === 'object' && 
               'bio' in alum.career_history[0] && 
               'experiences' in alum.career_history[0] && 
               Array.isArray((alum.career_history[0] as any).experiences) && 
               (alum.career_history[0] as any).experiences.length === 0))
          );
        });
        console.log('🔍 After hasCompleteProfile filtering:', filteredData.length, 'results')
      }
      
      // Cache the filtered results (only the full filtered dataset, not the paginated slice)
      const fullFilteredData = [...filteredData]; // Store the complete filtered dataset
      setFilteredCache(fullFilteredData);
      setLastFilterHash(currentFilterHash);
      
      // Apply client-side pagination
      const startIndex = pageNum * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      filteredData = fullFilteredData.slice(startIndex, endIndex);
      console.log('🔍 After client-side pagination:', { startIndex, endIndex, filteredDataLength: filteredData.length, pageNum, totalFilteredLength: fullFilteredData.length })

      // Debug: Check for duplicate IDs
      if (filteredData) {
        const ids = filteredData.map(alum => alum.id)
        const uniqueIds = new Set(ids)
        if (ids.length !== uniqueIds.size) {
          console.warn('Found duplicate IDs in alumni data:', 
            ids.filter(id => ids.indexOf(id) !== ids.lastIndexOf(id))
          )
        }
        console.log('🔍 Final alumni IDs for this page:', ids)
      }

      console.log('✅ Setting alumni data:', { length: filteredData.length, pageNum })
      
      // Always replace the alumni array when paginating - this is the key fix
      // The previous logic was trying to append data, which caused duplicates
      setAlumni(filteredData)
      
      // Update pagination state
      setTotalCount(fullFilteredData.length);
      setHasMore((pageNum + 1) * PAGE_SIZE < fullFilteredData.length);
      console.log('🔍 Pagination state:', { totalCount: fullFilteredData.length, hasMore: (pageNum + 1) * PAGE_SIZE < fullFilteredData.length })
    } catch (err) {
      console.error('❌ Exception while fetching alumni:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load and when filters/search change
  useEffect(() => {
    setAlumni([])
    setPage(0)
    setHasMore(true)
    setTotalCount(null)
    // Clear cache when filters change
    setFilteredCache([])
    setLastFilterHash('')
    fetchAlumni(0, true)
  }, [searchQuery, JSON.stringify(filters)])

  // Fetch alumni when page changes
  useEffect(() => {
    fetchAlumni(page, true);
    if (alumniListRef.current) {
      alumniListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilterChange = (newFilters: {
    company?: string[]
    role?: string[]
    city?: string[]
    graduationYear?: [number, number]
    hasCompleteProfile?: boolean
  }) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }

  // Handler for AI search bar submit
  const handleAiSearch = async (query: string) => {
    setAiLoading(true)
    setAiError(null)
    aiInputRef.current = query
    setAiInputValue(query)
    try {
      // Add artificial delay to make loading state visible
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) {
        throw new Error('AI search failed')
      }
      const { filters } = await res.json()
      // Convert location array to city options format
      const locationCities = (filters.location || []).map((city: string) => ({
        label: city,
        value: city
      }))
      setAiLocationCities(locationCities)

      // The AI now returns city-level locations, so we can use them directly
      const newFilters = {
        role: filters.role || [],
        city: filters.location || [],
        company: filters.companies || [],
        graduationYear: [
          filters.graduation_year_min || 2000,
          filters.graduation_year_max || currentYear,
        ] as [number, number],
        hasCompleteProfile: false,
      }
      setFilters(prev => ({
        ...prev,
        ...newFilters
      }))

      // Store the complete search data for previous searches
      addPreviousSearch({
        query,
        filters: newFilters,
        aiLocationCities: locationCities,
      })

      setAiQuery(query)
      setHasSearched(true)
      setManualSearchMode(false)
    } catch (err: any) {
      setAiError('Sorry, I could not understand your search. Please try again!')
    } finally {
      setAiLoading(false)
    }
  }

  // Handler for previous search selection - restore exact filters
  const handlePreviousSearchSelect = (searchData: any) => {
    console.log('🔄 Restoring previous search:', searchData)
    console.log('📊 Filters to restore:', searchData.filters)
    
    // Restore the AI input value
    setAiInputValue(searchData.query)
    console.log('✏️ Set AI input to:', searchData.query)
    
    // Restore the filters
    setFilters(searchData.filters)
    console.log('🔧 Set filters to:', searchData.filters)
    
    // Restore the AI location cities
    setAiLocationCities(searchData.aiLocationCities)
    console.log('🌍 Set location cities to:', searchData.aiLocationCities)
    
    // Set the search state
    setAiQuery(searchData.query)
    setHasSearched(true)
    setManualSearchMode(false)
    
    // Clear any errors
    setAiError(null)
    
    console.log('✅ Previous search restoration complete')
  }

  // Register the handler for previous search selection
  useEffect(() => {
    registerPreviousSearchHandler(handlePreviousSearchSelect)
  }, [registerPreviousSearchHandler])

  // Helper to generate page numbers with ellipsis (industry standard)
  const getPageNumbers = () => {
    if (!totalPages) return [];
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(0, 1, 2, 3, 'ellipsis', totalPages - 1);
      } else if (page >= totalPages - 4) {
        pages.push(0, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push(0, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages - 1);
      }
    }
    return pages;
  };

  return (
    <main className="min-h-screen bg-background flex flex-col relative">
      <BackgroundPaths isSearchActive={isSearchActive} />
      <div className={hasSearched || manualSearchMode ? "container mx-auto px-4 py-16 relative z-10" : "flex flex-1 flex-col items-center justify-center relative z-10"}>
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-primary mb-4 text-center">
              Alpha Kappa Psi Alumni Network
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="mb-4">
                  <Info className="h-5 w-5 font-bold" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-medium leading-none text-lg">About This Project</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      A search tool to connect with our very cracked alumni for mentorship and career opportunities.
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <a href="https://linkedin.com/in/cameronbyrne00" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors">Cameron Byrne</a> • May 2025
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-lg text-muted-foreground mb-4 text-center">
            Connecting brothers in{' '}
            <Typewriter
              phrases={[
                'technology',
                'finance',
                'consulting',
                'healthcare',
                'marketing',
                'entrepreneurship',
                'operations',
                'strategy',
              ]}
              typeSpeed={120}
              deleteSpeed={80}
              className="text-primary font-medium underline underline-offset-4"
            />
          </p>
        </div>
        <AiSearchBar 
          onSubmit={handleAiSearch} 
          value={aiInputValue}
          onChange={setAiInputValue}
          isLoading={aiLoading}
        />
        {/* Example prompts popover */}
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative flex justify-center mt-2"
          >
            <button
              ref={promptLinkRef}
              className="text-primary underline text-sm hover:text-primary/80 transition"
              type="button"
              onClick={() => setShowPromptPopover((v) => !v)}
            >
              example prompts
            </button>
            {showPromptPopover && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                  onClick={() => setShowPromptPopover(false)}
                  aria-label="Close example prompts popup"
                />
                {/* Centered popup relative to viewport */}
                <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-lg bg-white shadow-2xl border border-gray-200 p-6 flex flex-col gap-4">
                  <button
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors"
                    onClick={() => setShowPromptPopover(false)}
                    aria-label="Close"
                    type="button"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Example Prompts</h3>
                    <p className="text-sm text-muted-foreground">Click any prompt to apply it to your search</p>
                  </div>
                  <div className="space-y-2">
                    {examplePrompts.map((prompt) => (
                      <button
                        key={prompt}
                        className="w-full text-left px-4 py-3 rounded-md border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all duration-200 group"
                        type="button"
                        onClick={() => {
                          setAiInputValue(prompt);
                          setShowPromptPopover(false);
                        }}
                      >
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                          {prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {!manualSearchMode && !hasSearched && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-4 flex justify-center"
            >
              <button
                className="text-primary underline text-sm hover:text-primary/80 transition"
                onClick={() => setManualSearchMode(true)}
                type="button"
              >
                use manual filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {aiError && (
          <div className="flex flex-col items-center mt-4">
            <span className="text-red-500 text-sm">{aiError}</span>
          </div>
        )}
        {(hasSearched || manualSearchMode) && !aiLoading && (
          <>
            <motion.div 
              ref={manualFilterRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-8 mt-4"
            >
              <SearchFilter
                onSearch={setSearchQuery}
                onFilterChange={handleFilterChange}
                additionalCityOptions={aiLocationCities}
                currentFilters={filters}
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="mb-4 flex items-center justify-between"
            >
              {totalCount !== null && (
                <span className="text-muted-foreground text-base">{totalCount} Results Found</span>
              )}
              <button
                onClick={() => {
                  setFilters({
                    company: [],
                    role: [],
                    city: [],
                    graduationYear: undefined,
                    hasCompleteProfile: false,
                  })
                  setSearchQuery('')
                }}
                className="text-primary hover:text-primary/80 underline text-sm transition"
              >
                Clear filters
              </button>
            </motion.div>
            <motion.div 
              ref={alumniListRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {alumni.length === 0 && !loading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <span className="text-5xl mb-4">😢</span>
                  <p className="text-lg font-medium">No alumni found.</p>
                  <p className="text-base">Try removing some filters or broadening your search to see more results.</p>
                </div>
              ) : (
                alumni.map((alum) => (
                  <AlumniCard
                    key={alum.id}
                    name={alum.name}
                    pictureUrl={alum.picture_url}
                    role={alum.role}
                    companies={alum.companies}
                    bio={alum.bio || ''}
                    familyBranch={alum.family_branch}
                    graduationYear={alum.graduation_year}
                    location={alum.location}
                    bigBrother={alum.big_brother}
                    littleBrothers={alum.little_brothers}
                    linkedinUrl={alum.linkedin_url}
                    email={alum.emails}
                    phone={alum.phones}
                    major={alum.majors}
                    minor={alum.minors}
                    members={alumni.map(a => ({ id: a.id, name: a.name }))}
                    hasEnrichment={alum.has_enrichment}
                    scraped={alum.scraped}
                    careerHistory={alum.career_history}
                    education={alum.education}
                  />
                ))
              )}
            </motion.div>
            {/* Pagination controls - moved outside grid for true centering */}
            {totalPages > 1 && (
              <div className="w-full flex justify-center pt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          setPage((p) => {
                            const newPage = Math.max(0, p - 1);
                            if (alumniListRef.current) {
                              alumniListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                            return newPage;
                          });
                        }}
                        aria-disabled={page === 0}
                        tabIndex={page === 0 ? -1 : 0}
                        className={page === 0 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {getPageNumbers().map((p, idx) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => {
                              setPage(p as number);
                              if (alumniListRef.current) {
                                alumniListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            aria-current={p === page ? 'page' : undefined}
                            tabIndex={p === page ? -1 : 0}
                            href="#"
                          >
                            {p + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          setPage((p) => {
                            const newPage = Math.min(totalPages - 1, p + 1);
                            if (alumniListRef.current) {
                              alumniListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                            return newPage;
                          });
                        }}
                        aria-disabled={page === totalPages - 1}
                        tabIndex={page === totalPages - 1 ? -1 : 0}
                        className={page === totalPages - 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
} 