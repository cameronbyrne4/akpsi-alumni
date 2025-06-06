'use client'

import { useEffect, useState, useRef } from 'react'
import { AlumniCard } from '@/components/ui/alumni-card'
import { SearchFilter } from '@/components/search-filter'
import { supabase } from '@/lib/supabase'
import type { Alumni } from '@/lib/supabase'
import InfiniteScroll from '@/components/ui/infinite-scroll'
import { Loader2, X, Info } from 'lucide-react'
import { AiSearchBar } from '@/components/ai-search-bar'
import { useLayoutContext } from '@/components/client-layout-shell'
import { useSearchParams, useRouter } from 'next/navigation'
import { Typewriter } from '@/components/ui/typewriter'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 21;

const examplePrompts = [
  "People working on the East Coast",
  "Managers for anything in finance",
  "Who works at a FAANG company?",
  "Consultants who graduated over 10 years ago",
  "Big 4 consultants in Los Angeles",
];

export default function Home() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    industry: [] as string[],
    company: [] as string[],
    role: [] as string[],
    city: [] as string[],
    graduationYear: undefined as [number, number] | undefined,
    hasContact: false,
  })
  const {
    manualSearchMode,
    setManualSearchMode,
    previousSearches,
    addPreviousSearch,
    selectPreviousSearch,
  } = useLayoutContext()
  const [hasSearched, setHasSearched] = useState(false)
  const [aiQuery, setAiQuery] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiInputRef = useRef<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [aiLocationCities, setAiLocationCities] = useState<{ label: string; value: string }[]>([])
  const [aiSelectedFilters, setAiSelectedFilters] = useState({
    industry: [] as string[],
    role: [] as string[],
    city: [] as string[],
    graduationYear: [2000, 2023] as [number, number],
  })
  const [aiInputValue, setAiInputValue] = useState('');
  const [showPromptPopover, setShowPromptPopover] = useState(false);
  const promptLinkRef = useRef<HTMLButtonElement>(null);

  // If ?manual=1 is present, activate manual search mode
  useEffect(() => {
    if (searchParams.get('manual') === '1') {
      setManualSearchMode(true)
      setHasSearched(false)
      // Remove the query param from the URL after activating
      router.replace('/', { scroll: false })
    }
  }, [searchParams, setManualSearchMode, router])

  // Helper to build Supabase filter query
  const buildQuery = () => {
    let q = supabase.from('alumni').select('*', { count: 'exact' })
    
    // Has contact info - must be first filter
    if (filters.hasContact) {
      q = q.or('emails.not.is.null,phones.not.is.null,linkedin_url.not.is.null')
        .not('emails', 'eq', '{}')
        .not('phones', 'eq', '{}')
    }

    // Search
    if (searchQuery) {
      q = q.or(`name.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%,companies.cs.{${searchQuery}}`)
    }
    // Industry
    if (filters.industry.length > 0) {
      q = q.in('industry', filters.industry)
    }
    // Company
    if (filters.company.length > 0) {
      q = q.overlaps('companies', filters.company)
    }
    // Role
    if (filters.role.length > 0) {
      q = q.in('role', filters.role)
    }
    // City
    if (filters.city.length > 0) {
      q = q.in('location', filters.city)
    }
    // Graduation year
    if (filters.graduationYear) {
      const [minYear, maxYear] = filters.graduationYear
      q = q.gte('graduation_year', minYear).lte('graduation_year', maxYear)
    }
    return q
  }

  const fetchAlumni = async (pageNum: number, reset = false) => {
    setLoading(true)
    let q = buildQuery()
    q = q.order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1)
    
    try {
      const { data, error, count } = await q
      if (error) {
        console.error('Error fetching alumni:', error)
        setLoading(false)
        return
      }
      console.log('Fetched alumni data:', data)
      if (reset) {
        setAlumni(data || [])
      } else {
        setAlumni((prev) => [...prev, ...(data || [])])
      }
      setHasMore((data?.length || 0) === PAGE_SIZE)
      setTotalCount(count ?? 0)
    } catch (err) {
      console.error('Exception while fetching alumni:', err)
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
    fetchAlumni(0, true)
  }, [searchQuery, JSON.stringify(filters)])

  const next = async () => {
    const nextPage = page + 1
    await fetchAlumni(nextPage)
    setPage(nextPage)
  }

  const handleFilterChange = (newFilters: {
    industry?: string[]
    company?: string[]
    role?: string[]
    city?: string[]
    graduationYear?: [number, number]
  }) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }

  // When a previous search is selected, re-apply it as an AI search
  useEffect(() => {
    if (aiQuery) {
      setHasSearched(true)
      setManualSearchMode(false)
      // TODO: In the future, parse and apply the AI query as filters
    }
  }, [aiQuery, setManualSearchMode])

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

      // Set the selected filters for the UI
      setAiSelectedFilters({
        industry: filters.industry ? [filters.industry] : [],
        role: filters.role || [],
        city: filters.location || [],
        graduationYear: [
          filters.graduation_year_min || 2000,
          filters.graduation_year_max || 2023,
        ],
      })

      // The AI now returns city-level locations, so we can use them directly
      setFilters(prev => ({
        ...prev,
        industry: filters.industry ? [filters.industry] : [],
        role: filters.role || [],
        city: filters.location || [],
        company: filters.companies || [],
        graduationYear: [
          filters.graduation_year_min || 2000,
          filters.graduation_year_max || 2023,
        ],
      }))
      setAiQuery(query)
      setHasSearched(true)
      setManualSearchMode(false)
      addPreviousSearch(query)
    } catch (err: any) {
      setAiError('Sorry, I could not understand your search. Please try again!')
    } finally {
      setAiLoading(false)
    }
  }

  // Handler for previous search selection
  useEffect(() => {
    if (aiQuery && previousSearches.includes(aiQuery)) {
      setHasSearched(true)
      setManualSearchMode(false)
      // TODO: In the future, parse and apply the AI query as filters
    }
  }, [aiQuery, previousSearches, setManualSearchMode])

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className={hasSearched || manualSearchMode ? "container mx-auto px-4 py-16" : "flex flex-1 flex-col items-center justify-center"}>
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
        {!manualSearchMode && !hasSearched && (
          <div className="mt-4 flex justify-center">
            <button
              className="text-primary underline text-sm hover:text-primary/80 transition"
              onClick={() => setManualSearchMode(true)}
              type="button"
            >
              use manual filters
            </button>
          </div>
        )}
        {aiError && (
          <div className="flex flex-col items-center mt-4">
            <span className="text-red-500 text-sm">{aiError}</span>
          </div>
        )}
        {(hasSearched || manualSearchMode) && !aiLoading && (
          <>
            <div className={manualSearchMode ? "mb-8 mt-8" : "mb-8"}>
              <SearchFilter
                onSearch={setSearchQuery}
                onFilterChange={handleFilterChange}
                additionalCityOptions={aiLocationCities}
                selectedFilters={aiSelectedFilters}
              />
            </div>
            <div className="mb-4 flex items-center justify-between">
              {totalCount !== null && (
                <span className="text-muted-foreground text-base">{totalCount} Results Found</span>
              )}
              <button
                onClick={() => {
                  setFilters({
                    industry: [],
                    company: [],
                    role: [],
                    city: [],
                    graduationYear: undefined,
                    hasContact: false,
                  })
                  setSearchQuery('')
                  setAiSelectedFilters({
                    industry: [],
                    role: [],
                    city: [],
                    graduationYear: [2000, 2023],
                  })
                }}
                className="text-primary hover:text-primary/80 underline text-sm transition"
              >
                Clear filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    email={alum.email}
                    phone={alum.phone}
                    major={alum.major}
                    minor={alum.minor}
                  />
                ))
              )}
              <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={1}>
                {hasMore && <Loader2 className="my-4 h-8 w-8 animate-spin" />}
              </InfiniteScroll>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
