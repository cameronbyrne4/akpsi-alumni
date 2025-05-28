'use client'

import { useEffect, useState } from 'react'
import { AlumniCard } from '@/components/ui/alumni-card'
import { SearchFilter } from '@/components/search-filter'
import { supabase } from '@/lib/supabase'
import type { Alumni } from '@/lib/supabase'

export default function Home() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [filteredAlumni, setFilteredAlumni] = useState<Alumni[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    industry: 'all',
    familyBranch: 'all',
    graduationYear: 'all',
  })

  useEffect(() => {
    async function fetchAlumni() {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching alumni:', error)
        return
      }

      setAlumni(data || [])
      setFilteredAlumni(data || [])
    }

    fetchAlumni()
  }, [])

  useEffect(() => {
    let filtered = [...alumni]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.role.toLowerCase().includes(query) ||
          a.companies.some((c) => c.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (filters.industry && filters.industry !== 'all') {
      filtered = filtered.filter((a) => a.industry === filters.industry)
    }
    if (filters.familyBranch && filters.familyBranch !== 'all') {
      filtered = filtered.filter((a) => a.family_branch === filters.familyBranch)
    }
    if (filters.graduationYear && filters.graduationYear !== 'all') {
      filtered = filtered.filter(
        (a) => a.graduation_year.toString() === filters.graduationYear
      )
    }

    setFilteredAlumni(filtered)
  }, [alumni, searchQuery, filters])

  const handleFilterChange = (newFilters: {
    industry?: string
    familyBranch?: string
    graduationYear?: string
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alum) => (
            <AlumniCard
              key={alum.id}
              name={alum.name}
              pictureUrl={alum.picture_url}
              role={alum.role}
              companies={alum.companies}
              bio={alum.bio}
              familyBranch={alum.family_branch}
              graduationYear={alum.graduation_year}
              location={alum.location}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
