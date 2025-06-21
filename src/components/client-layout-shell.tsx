"use client";
import { useState, createContext, useContext, useRef, useEffect } from 'react'
import { SideNav } from '@/components/side-nav'
import { usePathname, useRouter } from 'next/navigation'

interface SearchData {
  query: string
  filters: {
    company: string[]
    role: string[]
    city: string[]
    graduationYear?: [number, number]
    hasCompleteProfile: boolean
  }
  aiLocationCities: { label: string; value: string }[]
}

interface LayoutContextType {
  manualSearchMode: boolean
  setManualSearchMode: (value: boolean) => void
  previousSearches: SearchData[]
  addPreviousSearch: (searchData: SearchData) => void
  selectPreviousSearch: (searchData: SearchData) => void
  registerPreviousSearchHandler: (handler: (searchData: SearchData) => void) => void
}

const LayoutContext = createContext<LayoutContextType>({
  manualSearchMode: false,
  setManualSearchMode: () => {},
  previousSearches: [],
  addPreviousSearch: () => {},
  selectPreviousSearch: () => {},
  registerPreviousSearchHandler: () => {},
})

export const useLayoutContext = () => useContext(LayoutContext)

const STORAGE_KEY = 'akpsi_previous_searches'

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const [manualSearchMode, setManualSearchMode] = useState(false)
  const [previousSearches, setPreviousSearches] = useState<SearchData[]>([])
  const previousSearchHandlerRef = useRef<((searchData: SearchData) => void) | null>(null)

  const pathname = usePathname()
  const router = useRouter()

  // Load previous searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreviousSearches(parsed)
      }
    } catch (error) {
      console.error('Failed to load previous searches from localStorage:', error)
    }
  }, [])

  // Save previous searches to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previousSearches))
    } catch (error) {
      console.error('Failed to save previous searches to localStorage:', error)
    }
  }, [previousSearches])

  // Add a search to previous searches if not already present
  const addPreviousSearch = (searchData: SearchData) => {
    setPreviousSearches((prev) => {
      // Remove if already exists (to move to top)
      const filtered = prev.filter(search => search.query !== searchData.query)
      return [searchData, ...filtered].slice(0, 10) // Keep last 10 searches
    })
  }

  // When a previous search is selected, set manualSearchMode to false and trigger the search
  const selectPreviousSearch = (searchData: SearchData) => {
    console.log('🎯 Previous search selected:', searchData.query)
    setManualSearchMode(false)
    // Call the registered handler from the home page
    if (previousSearchHandlerRef.current) {
      console.log('📞 Calling registered handler...')
      previousSearchHandlerRef.current(searchData)
    } else {
      console.log('❌ No handler registered!')
    }
  }

  // Register a handler for previous search selection
  const registerPreviousSearchHandler = (handler: (searchData: SearchData) => void) => {
    console.log('📝 Registering previous search handler')
    previousSearchHandlerRef.current = handler
  }

  const handleManualSearch = () => {
    if (pathname !== '/') {
      router.push('/')
    } // else do nothing
  }
  const handleFamilyTrees = () => {
    if (pathname !== '/family-tree') {
      router.push('/family-tree')
    } // else do nothing
  }

  return (
    <LayoutContext.Provider value={{
      manualSearchMode,
      setManualSearchMode,
      previousSearches,
      addPreviousSearch,
      selectPreviousSearch,
      registerPreviousSearchHandler,
    }}>
      <SideNav
        open={navOpen}
        onOpen={() => setNavOpen(true)}
        onClose={() => setNavOpen(false)}
        onManualSearch={handleManualSearch}
        onFamilyTrees={handleFamilyTrees}
        previousSearches={previousSearches}
        onSelectPrevious={selectPreviousSearch}
      />
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${navOpen ? 'ml-64' : 'ml-0'}`}>
        {children}
      </div>
    </LayoutContext.Provider>
  )
}
