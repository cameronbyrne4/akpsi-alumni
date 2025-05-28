import { Input } from '@/components/ui/input'
import { DualRangeSlider } from '@/components/ui/dual-range-slider'
import { MultiSelect } from '@/components/ui/multi-select'
import { useState } from 'react'

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: {
    industry?: string[]
    company?: string[]
    role?: string[]
    city?: string[]
    graduationYear?: [number, number]
  }) => void
}

const industryOptions = [
  { label: 'Technology', value: 'Technology' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Consulting', value: 'Consulting' },
  { label: 'Education', value: 'Education' },
  { label: 'Government', value: 'Government' },
  { label: 'Non-Profit', value: 'Non-Profit' },
]

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

const cityOptions = [
  { label: 'New York, NY', value: 'New York, NY' },
  { label: 'San Francisco, CA', value: 'San Francisco, CA' },
  { label: 'Seattle, WA', value: 'Seattle, WA' },
  { label: 'Boston, MA', value: 'Boston, MA' },
  { label: 'Chicago, IL', value: 'Chicago, IL' },
  { label: 'Austin, TX', value: 'Austin, TX' },
  { label: 'Los Angeles, CA', value: 'Los Angeles, CA' },
  { label: 'Washington DC', value: 'Washington DC' },
]

export function SearchFilter({ onSearch, onFilterChange }: SearchFilterProps) {
  const [yearRange, setYearRange] = useState<[number, number]>([2000, 2023])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])

  const handleYearChange = (value: number[]) => {
    const newRange = value as [number, number]
    setYearRange(newRange)
    onFilterChange({ graduationYear: newRange })
  }

  const handleIndustryChange = (value: string[]) => {
    setSelectedIndustries(value)
    onFilterChange({ industry: value })
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

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search alumni..."
        className="w-full"
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="flex flex-wrap gap-4">
        <MultiSelect
          options={industryOptions}
          selected={selectedIndustries}
          onChange={handleIndustryChange}
          placeholder="Industry"
        />

        <MultiSelect
          options={companyOptions}
          selected={selectedCompanies}
          onChange={handleCompanyChange}
          placeholder="Company"
        />

        <MultiSelect
          options={roleOptions}
          selected={selectedRoles}
          onChange={handleRoleChange}
          placeholder="Role"
        />

        <MultiSelect
          options={cityOptions}
          selected={selectedCities}
          onChange={handleCityChange}
          placeholder="City"
        />

        <div className="w-[300px] space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Graduation Year: {yearRange[0]} - {yearRange[1]}</span>
          </div>
          <DualRangeSlider
            value={yearRange}
            onValueChange={handleYearChange}
            min={2000}
            max={2023}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
} 