import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Users } from 'lucide-react'

interface AlumniCardProps {
  name: string
  pictureUrl?: string | null
  role: string
  companies: string[]
  bio: string
  familyBranch: string
  graduationYear: number
  location: string
}

export function AlumniCard({
  name,
  role,
  companies,
  bio,
  familyBranch,
  graduationYear,
  location,
}: AlumniCardProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-6 pb-0">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">{initials}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => (
              <Badge key={company} variant="secondary">
                {company}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{bio}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{familyBranch}</span>
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>{graduationYear}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 