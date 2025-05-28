import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchFilterProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: {
    industry?: string
    familyBranch?: string
    graduationYear?: string
  }) => void
}

export function SearchFilter({ onSearch, onFilterChange }: SearchFilterProps) {
  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search alumni..."
        className="w-full"
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="flex gap-4">
        <Select onValueChange={(value) => onFilterChange({ industry: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => onFilterChange({ familyBranch: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Family Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="Lambda">Lambda</SelectItem>
            <SelectItem value="Omega">Omega</SelectItem>
            <SelectItem value="Gamma">Gamma</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => onFilterChange({ graduationYear: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Graduation Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
            <SelectItem value="2020">2020</SelectItem>
            <SelectItem value="2019">2019</SelectItem>
            <SelectItem value="2018">2018</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 