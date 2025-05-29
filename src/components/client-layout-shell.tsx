"use client";
import { useState, createContext, useContext } from 'react'
import { SideNav } from '@/components/side-nav'
import { usePathname, useRouter } from 'next/navigation'

interface LayoutContextType {
  manualSearchMode: boolean
  setManualSearchMode: (v: boolean) => void
  previousSearches: string[]
  addPreviousSearch: (query: string) => void
  selectPreviousSearch: (query: string) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function useLayoutContext() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayoutContext must be used within ClientLayoutShell')
  return ctx
}

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const [manualSearchMode, setManualSearchMode] = useState(false)
  const [previousSearches, setPreviousSearches] = useState<string[]>([])

  const pathname = usePathname()
  const router = useRouter()

  // Add a query to previous searches if not already present
  const addPreviousSearch = (query: string) => {
    setPreviousSearches((prev) => prev.includes(query) ? prev : [query, ...prev])
  }

  // When a previous search is selected, set manualSearchMode to false and trigger the search
  const selectPreviousSearch = (query: string) => {
    setManualSearchMode(false)
    // You can trigger a search in the home page using context
    // For now, just log
    console.log('Selected previous search:', query)
  }

  const handleManualSearch = () => {
    if (pathname !== '/') {
      router.push('/')
    } // else do nothing
  }
  const handleFamilyTrees = () => {
    window.location.href = '/family-trees'
  }

  return (
    <LayoutContext.Provider value={{
      manualSearchMode,
      setManualSearchMode,
      previousSearches,
      addPreviousSearch,
      selectPreviousSearch,
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
      <div className="min-h-screen">{children}</div>
    </LayoutContext.Provider>
  )
}
