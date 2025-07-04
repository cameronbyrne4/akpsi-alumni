'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder: string
  label: string
  className?: string
}

export function MultiSelect({
  options: initialOptions,
  selected,
  onChange,
  placeholder,
  label,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState(initialOptions)
  const [pending, setPending] = React.useState<string[]>(selected)
  const [input, setInput] = React.useState('')
  const prevSelected = React.useRef<string[]>(selected)

  React.useEffect(() => {
    if (!open) {
      setPending(selected)
      setInput('')
      const customOptions = selected
        .filter(sel => !initialOptions.some(opt => opt.value === sel))
        .map(sel => ({ label: sel, value: sel }))
      setOptions([...customOptions, ...initialOptions])
    }
  }, [open, selected, initialOptions])

  const handleSelect = (value: string) => {
    setPending((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    )
  }

  const handleInputChange = (val: string) => {
    setInput(val)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      input.trim() &&
      !options.some(o => o.value.toLowerCase() === input.trim().toLowerCase())
    ) {
      const newOption = { label: input.trim(), value: input.trim() }
      setOptions((prev) => [...prev, newOption])
      setPending((prev) => [...prev, input.trim()])
      setInput('')
      e.preventDefault()
    }
  }

  const handleCancel = () => {
    setPending(prevSelected.current)
    setOpen(false)
  }

  const handleShowResults = () => {
    onChange(pending)
    setOpen(false)
  }

  const handlePopoverOpenChange = (val: boolean) => {
    if (!val) {
      setPending(selected)
      setInput('')
      const customOptions = selected
        .filter(sel => !initialOptions.some(opt => opt.value === sel))
        .map(sel => ({ label: sel, value: sel }))
      setOptions([...customOptions, ...initialOptions])
    } else {
      prevSelected.current = selected
    }
    setOpen(val)
  }

  // Helper to choose 'a' or 'an' based on the first letter
  function getArticle(word: string) {
    return /^[aeiou]/i.test(word) ? 'an' : 'a';
  }

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[180px] flex items-center justify-between', className)}
        >
          <span className="flex items-center gap-2">
            {label}
            {selected.length > 0 && (
              <Badge
                className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 min-w-[1.5em] h-6 flex items-center justify-center text-xs font-bold border-0 shadow-none"
                variant="default"
              >
                {selected.length}
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[260px] p-0 max-h-[300px] overflow-hidden" 
        align="start"
        sideOffset={4}
      >
        <div className="relative border-b px-3 py-2 flex items-center justify-end">
          <button
            className="p-1 rounded hover:bg-muted"
            aria-label="Close"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Command className="max-h-[200px]">
          <CommandInput
            value={input}
            onValueChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={`Add ${getArticle(placeholder)} ${placeholder.toLowerCase()}`}
            className="px-3"
          />
          <div className="overflow-y-auto max-h-[150px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={pending.includes(option.value)}
                    readOnly
                    className="mr-2 accent-primary"
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        </Command>
        <div className="flex justify-between border-t px-3 py-2 bg-background">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="hover:bg-muted">
            Cancel
          </Button>
          <Button size="sm" onClick={handleShowResults} className="hover:bg-primary/90">
            Show results
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 