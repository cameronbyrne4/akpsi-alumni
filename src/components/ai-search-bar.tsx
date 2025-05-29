import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

interface AiSearchBarProps {
  onSubmit: (query: string) => void
  value?: string
  onChange?: (value: string) => void
}

export function AiSearchBar({ onSubmit, value, onChange }: AiSearchBarProps) {
  const [input, setInput] = useState('')
  const isControlled = value !== undefined && onChange !== undefined
  const inputValue = isControlled ? value : input
  const setInputValue = isControlled ? onChange : setInput

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSubmit(inputValue.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full mb-8">
      <div className="w-full max-w-2xl flex items-center rounded-2xl border bg-white shadow px-6 py-4">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Search for people who…"
          className="flex-1 bg-transparent outline-none text-lg placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="ml-2 rounded-full bg-gray-100 hover:bg-gray-200 p-2 transition"
          aria-label="Search"
        >
          <ArrowUpRight className="h-6 w-6 text-gray-500" />
        </button>
      </div>
      {/* Optional: Suggested queries as chips can go here */}
    </form>
  )
} 