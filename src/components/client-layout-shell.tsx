"use client";
import { useState, createContext, useContext } from 'react'
import { SideNav } from '@/components/side-nav'
import { usePathname, useRouter } from 'next/navigation'

interface LayoutContextType {
  manualSearchMode: boolean
  setManualSearchMode: (value: boolean) => void
  previousSearches: string[]
  addPreviousSearch: (query: string) => void
  selectPreviousSearch: (query: string) => void
}

const LayoutContext = createContext<LayoutContextType>({
  manualSearchMode: false,
  setManualSearchMode: () => {},
  previousSearches: [],
  addPreviousSearch: () => {},
  selectPreviousSearch: () => {},
})

export const useLayoutContext = () => useContext(LayoutContext)

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
