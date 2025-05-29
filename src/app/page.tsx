'use client'

import { useEffect, useState } from 'react'
import { AlumniCard } from '@/components/ui/alumni-card'
import { SearchFilter } from '@/components/search-filter'
import { supabase } from '@/lib/supabase'
import type { Alumni } from '@/lib/supabase'
import InfiniteScroll from '@/components/ui/infinite-scroll'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 21;

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
    graduationYear: [2000, 2023] as [number, number],
  })

  // Helper to build Supabase filter query
  const buildQuery = () => {
    let q = supabase.from('alumni').select('*', { count: 'exact' })
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
    const { data, error, count } = await q
    if (error) {
      setLoading(false)
      return
    }
    if (reset) {
      setAlumni(data || [])
    } else {
      setAlumni((prev) => [...prev, ...(data || [])])
    }
    setHasMore((data?.length || 0) === PAGE_SIZE)
    setTotalCount(count ?? 0)
    setLoading(false)
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

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Alpha Kappa Psi Alumni Network
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Connecting brothers across generations
        </p>

        <div className="mb-8">
          <SearchFilter
            onSearch={setSearchQuery}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className="mb-4 flex items-center">
          {totalCount !== null && (
            <span className="text-muted-foreground text-base">{totalCount} Results Found</span>
          )}
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
              />
            ))
          )}
          <InfiniteScroll hasMore={hasMore} isLoading={loading} next={next} threshold={1}>
            {hasMore && <Loader2 className="my-4 h-8 w-8 animate-spin" />}
          </InfiniteScroll>
        </div>
      </div>
    </main>
  )
}
