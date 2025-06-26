import { useState, useEffect } from 'react'
import { PanelLeftOpen, PanelLeftClose, UserSearch, Network } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useUserData } from '@/hooks/useUserData'

// Add this at the top of the file, after imports

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: any) => void;
      closePopup?: (formId: string) => void;
    };
  }
}

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

interface SideNavProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  onManualSearch: () => void
  onFamilyTrees: () => void
  previousSearches: SearchData[]
  onSelectPrevious: (searchData: SearchData) => void
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
      {/* Hamburger icon - always visible */}
      <button
        className="fixed top-4 left-4 z-[60] p-2 rounded-md text-slate-800 hover:bg-blue-200/60 transition-colors"
        onClick={open ? onClose : onOpen}
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <PanelLeftClose className="h-6 w-6" /> : <PanelLeftOpen className="h-6 w-6" />}
      </button>
      {/* Side nav */}
      <nav
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-blue-100/80 backdrop-blur-lg border-r border-blue-200/80 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-end px-4 py-4 border-b border-blue-200/80">
          {/* Removed the close button - now using the hamburger button above */}
          <div className="w-8 h-8"></div> {/* Spacer to maintain layout */}
        </div>
        <ul className="flex flex-col gap-2 p-4 text-slate-800">
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/' ? 'bg-blue-200 font-semibold' : 'hover:bg-blue-200/60'}`}
              onClick={() => { onManualSearch(); }}
            >
              <span className="inline-flex items-center gap-2">
                <UserSearch className="h-5 w-5" />
                Alumni Search
              </span>
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/family-tree' ? 'bg-blue-200 font-semibold' : 'hover:bg-blue-200/60'}`}
              onClick={() => { onFamilyTrees(); }}
            >
              <span className="inline-flex items-center gap-2">
                <Network className="h-5 w-5" />
                Family Trees
              </span>
            </button>
          </li>
          {!isLoading && isAdmin && (
            <>
              <li>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/update-alumni' ? 'bg-blue-200 font-semibold' : 'hover:bg-blue-200/60'}`}
                  onClick={handleUpdateAlumni}
                >
                  Update Alumni
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition ${pathname === '/admin/family-tree' ? 'bg-blue-200 font-semibold' : 'hover:bg-blue-200/60'}`}
                  onClick={() => router.push('/admin/family-tree')}
                >
                  Manage Family Trees
                </button>
              </li>
            </>
          )}
        </ul>
        <div className="border-t border-blue-200/80 px-4 pt-4">
          <div className="font-semibold text-sm mb-2 text-slate-600">Recent Searches</div>
          <ul className="flex flex-col gap-1 text-slate-800">
            {previousSearches.length === 0 && (
              <li className="text-xs text-slate-500">No recent searches</li>
            )}
            {previousSearches.map((searchData, idx) => (
              <li key={idx}>
                <button
                  className="w-full text-left px-2 py-1 rounded hover:bg-blue-200/60 text-sm truncate"
                  onClick={() => { onSelectPrevious(searchData); }}
                  title={searchData.query}
                >
                  {searchData.query}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Feedback/complaint link at the bottom */}
        <div className="absolute bottom-0 left-0 w-full border-t border-blue-200/80 bg-blue-100/80 px-4 py-4">
          <button
            className="w-full text-left text-sm text-blue-900 underline hover:text-blue-700 transition-colors"
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.Tally && typeof window.Tally.openPopup === 'function') {
                window.Tally.openPopup('nGVejz', { layout: 'modal', width: 600 });
              } else {
                window.open('https://tally.so/r/nGVejz', '_blank');
              }
            }}
          >
            Having issues?
          </button>
        </div>
      </nav>
    </>
  )
} 