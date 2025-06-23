'use client'

import { useEffect, useState, useRef } from 'react'
import { AlumniCard } from '@/components/ui/alumni-card'
import { SearchFilter } from '@/components/search-filter'
import { supabase } from '@/lib/supabase'
import type { Alumni } from '@/lib/supabase'
import { Loader2, X, Info } from 'lucide-react'
import { AiSearchBar } from '@/components/ai-search-bar'
import { useLayoutContext } from '@/components/client-layout-shell'
import { useSearchParams, useRouter } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const [aiLocationCities, setAiLocationCities] = useState<{ label: string; value: string }[]>([])
  const [aiInputValue, setAiInputValue] = useState('');
  const [showPromptPopover, setShowPromptPopover] = useState(false);
  const promptLinkRef = useRef<HTMLButtonElement>(null);
  const manualFilterRef = useRef<HTMLDivElement>(null);
  const alumniListRef = useRef<HTMLDivElement>(null);

  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  // If ?manual=1 is present, activate manual search mode
  useEffect(() => {
    if (searchParams.get('manual') === '1') {
      setManualSearchMode(true)
      setHasSearched(false)
      // Remove the query param from the URL after activating
      router.replace('/', { scroll: false })
    }
  }, [searchParams, setManualSearchMode, router])

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

    // Search - simple text search
    if (searchQuery) {
      console.log('🔍 Adding search query:', searchQuery)
      q = q.or(`name.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%`)
    }
    
    // Company - simple contains search
    if (filters.company.length > 0) {
      console.log('🔍 Adding company filters:', filters.company)
      // Use the first company for now - we can improve this later
      q = q.contains('companies', [filters.company[0]])
    }
    
    // Role - simple text search
    if (filters.role.length > 0) {
      console.log('🔍 Adding role filters:', filters.role)
      // Use the first role for now - we can improve this later
      q = q.ilike('role', `%${filters.role[0]}%`)
    }
    
    // Note: City filtering will be done client-side after fetching data
    // since we need to use the matchesCityFilter function
    
    // Graduation year
    if (filters.graduationYear) {
      console.log('🔍 Adding graduation year filter:', filters.graduationYear)
      const [minYear, maxYear] = filters.graduationYear
      q = q.gte('graduation_year', minYear).lte('graduation_year', maxYear)
    }
    
    console.log('🔍 Final query built')
    return q
  }

  const fetchAlumni = async (pageNum: number, reset = false) => {
    console.log('🚀 fetchAlumni called with:', { pageNum, reset })
    setLoading(true)
    
    // If we have city filters, we need to fetch all data and filter client-side
    // because Supabase can't handle our complex city matching logic
    const needsClientSideFiltering = filters.city.length > 0;
    
    // Create a hash of current filters to check if we need to refetch
    const currentFilterHash = JSON.stringify({
      searchQuery,
      company: filters.company,
      role: filters.role,
      graduationYear: filters.graduationYear,
      hasCompleteProfile: filters.hasCompleteProfile,
      city: filters.city
    });
    
    // If we have city filters and the cache is valid, use it
    if (needsClientSideFiltering && !reset && lastFilterHash === currentFilterHash && filteredCache.length > 0) {
      console.log('🔍 Using cached filtered results')
      const startIndex = pageNum * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageData = filteredCache.slice(startIndex, endIndex);
      
      setAlumni(pageData);
      setTotalCount(filteredCache.length);
      setHasMore((pageNum + 1) * PAGE_SIZE < filteredCache.length);
      setLoading(false);
      return;
    }
    
    let q = buildQuery()
    
    if (needsClientSideFiltering) {
      // Fetch all data for client-side filtering
      q = q.order('created_at', { ascending: false })
    } else {
      // Use normal pagination for other filters
      q = q.order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1)
    }
    
    try {
      console.log('📡 Executing Supabase query...')
      const { data, error, count } = await q
      console.log('📡 Query result:', { dataLength: data?.length, error, count })
      
      if (error) {
        console.error('❌ Error fetching alumni:', error)
        setLoading(false)
        return
      }

      // Apply city filtering client-side if needed
      let filteredData = data || [];
      if (needsClientSideFiltering) {
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
        
        // Cache the filtered results
        setFilteredCache(filteredData);
        setLastFilterHash(currentFilterHash);
        
        // Apply client-side pagination
        const startIndex = pageNum * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        filteredData = filteredData.slice(startIndex, endIndex);
        console.log('🔍 After pagination:', filteredData.length, 'results for page', pageNum)
      } else {
        // Clear cache when not using client-side filtering
        setFilteredCache([]);
        setLastFilterHash('');
      }

      // Debug: Check for duplicate IDs
      if (filteredData) {
        const ids = filteredData.map(alum => alum.id)
        const uniqueIds = new Set(ids)
        if (ids.length !== uniqueIds.size) {
          console.warn('Found duplicate IDs in alumni data:', 
            ids.filter(id => ids.indexOf(id) !== ids.lastIndexOf(id))
          )
        }
      }

      console.log('✅ Fetched alumni data:', filteredData)
      if (reset) {
        setAlumni(filteredData)
      } else {
        // Ensure we don't add duplicates when appending
        setAlumni(prev => {
          const existingIds = new Set(prev.map(a => a.id))
          const newAlumni = filteredData.filter(a => !existingIds.has(a.id))
          return [...prev, ...newAlumni]
        })
      }
      
      // Update pagination state
      if (needsClientSideFiltering) {
        // For client-side filtering, we need to fetch all data to get accurate count
        // This is a limitation but necessary for accurate city filtering
        const allData = data || [];
        const allFilteredData = allData.filter(alum => {
          return filters.city.some(city => matchesCityFilter(alum.location, city));
        });
        setTotalCount(allFilteredData.length);
        setHasMore((pageNum + 1) * PAGE_SIZE < allFilteredData.length);
      } else {
        setHasMore((filteredData?.length || 0) === PAGE_SIZE)
        setTotalCount(count ?? 0)
      }
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
      await new Promise(resolve => setTimeout(resolve, 2000))
      
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
      <BackgroundPaths />
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
                      <p className="text-sm font-medium">Credits</p>
                      <p className="text-sm text-muted-foreground">
                        <a href="https://linkedin.com/in/cameronbyrne00" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline underline-offset-2 hover:text-primary transition-colors">Cameron Byrne</a> + Parth Mahajan
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">May 2025</p>
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
        <div className="relative flex justify-center mt-2">
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
              {/* Centered popup */}
              <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-lg bg-white shadow-2xl border border-gray-200 p-6 flex flex-col gap-3">
                <button
                  className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                  onClick={() => setShowPromptPopover(false)}
                  aria-label="Close"
                  type="button"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
                <div className="mb-2 font-semibold text-lg text-center">Example Prompts</div>
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="text-left px-3 py-2 rounded hover:bg-primary/10 text-sm text-primary border border-primary/20"
                    type="button"
                    onClick={() => {
                      setAiInputValue(prompt);
                      setShowPromptPopover(false);
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
              className={manualSearchMode ? "mb-8 mt-8" : "mb-8"}
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
                            onClick={() => setPage(p as number)}
                            aria-current={p === page ? 'page' : undefined}
                            tabIndex={0}
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
