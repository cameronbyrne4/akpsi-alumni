import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useUserData } from '@/hooks/useUserData'

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SideNavProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  onManualSearch: () => void
  onFamilyTrees: () => void
  previousSearches: string[]
  onSelectPrevious: (query: string) => void
}

export function SideNav({
  open,
  onClose,
  onOpen,
  onManualSearch,
  onFamilyTrees,
  previousSearches,
  onSelectPrevious,
}: SideNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, isLoading } = useUserData()

  const handleNewSearch = () => {
    router.push('/')
  }

  const handleUpdateAlumni = () => {
    router.push('/update-alumni')
  }

  return (
    <>
      {/* Hamburger icon */}
      {!open && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition"
          onClick={onOpen}
          aria-label="Open navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      {/* Side nav */}
      <nav
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-secondary/50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={onClose} aria-label="Close navigation" className="p-1 rounded hover:bg-secondary/80">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="flex flex-col gap-2 p-4">
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/' ? 'bg-primary/10 font-semibold' : 'hover:bg-secondary/80'}`}
              onClick={() => { onManualSearch(); }}
            >
              Alumni Search
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/family-tree' ? 'bg-primary/10 font-semibold' : 'hover:bg-secondary/80'}`}
              onClick={() => { onFamilyTrees(); }}
            >
              Family Trees
            </button>
          </li>
          {!isLoading && isAdmin && (
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/update-alumni' ? 'bg-primary/10 font-semibold' : 'hover:bg-secondary/80'}`}
                onClick={handleUpdateAlumni}
              >
                Update Alumni
              </button>
            </li>
          )}
        </ul>
        <div className="border-t border-border/50 px-4 pt-4">
          <div className="font-semibold text-sm mb-2 text-muted-foreground">Previous Searches</div>
          <ul className="flex flex-col gap-1">
            {previousSearches.length === 0 && (
              <li className="text-xs text-muted-foreground">No previous searches</li>
            )}
            {previousSearches.map((query, idx) => (
              <li key={idx}>
                <button
                  className="w-full text-left px-2 py-1 rounded hover:bg-secondary/80 text-sm truncate"
                  onClick={() => { onSelectPrevious(query); }}
                  title={query}
                >
                  {query}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
} 