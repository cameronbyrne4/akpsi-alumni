import { Input } from '@/components/ui/input'
import { DualRangeSlider } from '@/components/ui/dual-range-slider'
import { MultiSelect } from '@/components/ui/multi-select'
import { useState } from 'react'
import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: {
    company?: string[]
    role?: string[]
    city?: string[]
    graduationYear?: [number, number]
    hasCompleteProfile?: boolean
  }) => void
  additionalCityOptions?: { label: string; value: string }[]
  currentFilters?: {
    company: string[]
    role: string[]
    city: string[]
    graduationYear?: [number, number]
    hasCompleteProfile: boolean
  }
}

const companyOptions = [
  { label: 'Google', value: 'Google' },
  { label: 'Microsoft', value: 'Microsoft' },
  { label: 'Amazon', value: 'Amazon' },
  { label: 'Meta', value: 'Meta' },
  { label: 'Apple', value: 'Apple' },
  { label: 'Goldman Sachs', value: 'Goldman Sachs' },
  { label: 'JPMorgan', value: 'JPMorgan' },
  { label: 'McKinsey', value: 'McKinsey' },
  { label: 'Deloitte', value: 'Deloitte' },
]

const roleOptions = [
  { label: 'Software Engineer', value: 'Software Engineer' },
  { label: 'Product Manager', value: 'Product Manager' },
  { label: 'Data Scientist', value: 'Data Scientist' },
  { label: 'Business Analyst', value: 'Business Analyst' },
  { label: 'Consultant', value: 'Consultant' },
  { label: 'Project Manager', value: 'Project Manager' },
  { label: 'Marketing Manager', value: 'Marketing Manager' },
  { label: 'Sales Representative', value: 'Sales Representative' },
]

export function SearchFilter({ 
  onSearch, 
  onFilterChange, 
  additionalCityOptions = [],
  currentFilters,
}: SearchFilterProps) {
  const currentYear = new Date().getFullYear()
  const [yearRange, setYearRange] = useState<[number, number]>([2000, currentYear])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [hasCompleteProfile, setHasCompleteProfile] = useState<boolean>(false)

  // Sync with current filters when they change
  React.useEffect(() => {
    if (currentFilters) {
      setSelectedCompanies(currentFilters.company || [])
      setSelectedRoles(currentFilters.role || [])
      setSelectedCities(currentFilters.city || [])
      if (currentFilters.graduationYear) {
        setYearRange(currentFilters.graduationYear)
      }
      setHasCompleteProfile(currentFilters.hasCompleteProfile || false)
    }
  }, [currentFilters])

  // Combine default city options with additional ones
  const allCityOptions = React.useMemo(() => {
    const defaultOptions = [
      { label: 'New York', value: 'New York' },
      { label: 'San Francisco', value: 'San Francisco' },
      { label: 'Seattle', value: 'Seattle' },
      { label: 'Boston', value: 'Boston' },
      { label: 'Chicago', value: 'Chicago' },
      { label: 'Austin', value: 'Austin' },
      { label: 'Los Angeles', value: 'Los Angeles' },
      { label: 'Washington DC', value: 'Washington DC' },
    ]
    // Merge additional options, avoiding duplicates
    const merged = [...defaultOptions]
    additionalCityOptions.forEach(option => {
      if (!merged.some(existing => existing.value === option.value)) {
        merged.push(option)
      }
    })
    return merged
  }, [additionalCityOptions])

  const handleYearChange = (value: number[]) => {
    const newRange = value as [number, number]
    setYearRange(newRange)
    onFilterChange({ graduationYear: newRange })
  }

  const handleCompanyChange = (value: string[]) => {
    setSelectedCompanies(value)
    onFilterChange({ company: value })
  }

  const handleRoleChange = (value: string[]) => {
    setSelectedRoles(value)
    onFilterChange({ role: value })
  }

  const handleCityChange = (value: string[]) => {
    setSelectedCities(value)
    onFilterChange({ city: value })
  }

  const handleHasCompleteProfileChange = (checked: boolean) => {
    setHasCompleteProfile(checked)
    onFilterChange({ hasCompleteProfile: checked })
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Direct search by name or title..."
        className="w-full"
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="flex flex-wrap gap-4">
        <MultiSelect
          options={companyOptions}
          selected={selectedCompanies}
          onChange={handleCompanyChange}
          placeholder="Company"
          label="Companies"
        />

        <MultiSelect
          options={roleOptions}
          selected={selectedRoles}
          onChange={handleRoleChange}
          placeholder="Role"
          label="Roles"
        />

        <MultiSelect
          options={allCityOptions}
          selected={selectedCities}
          onChange={handleCityChange}
          placeholder="City"
          label="Cities"
        />

        <div className="w-[300px] space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Graduation Year: {yearRange[0]} - {yearRange[1]}</span>
          </div>
          <DualRangeSlider
            value={yearRange}
            onValueChange={handleYearChange}
            min={2000}
            max={currentYear}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasCompleteProfile"
            checked={hasCompleteProfile}
            onCheckedChange={handleHasCompleteProfileChange}
          />
          <Label
            htmlFor="hasCompleteProfile"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Has Professional Info
          </Label>
        </div>
      </div>
    </div>
  )
} 