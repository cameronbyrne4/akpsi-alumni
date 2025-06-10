import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AlumniProfileDialog } from '@/components/ui/alumni-profile-dialog'

interface AlumniCardProps {
  name: string
  pictureUrl?: string | null
  role?: string | null
  companies?: string[]
  bio?: string | null
  familyBranch?: string | null
  graduationYear?: number | null
  location?: string | null
  bigBrother?: string | null
  littleBrothers?: string[] | null
  linkedinUrl?: string | null
  email?: string[] | null
  phone?: string[] | null
  major?: string[] | null
  minor?: string[] | null
  members?: Array<{ id: string; name: string }>
}

export function AlumniCard({
  name,
  role,
  companies = [],
  bio = '',
  familyBranch,
  graduationYear,
  location,
  bigBrother,
  littleBrothers,
  linkedinUrl,
  email,
  phone,
  major,
  minor,
  members = [],
}: AlumniCardProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">{initials}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                {role && <p className="text-sm text-muted-foreground">{role}</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {companies && companies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {companies.map((company) => (
                    <Badge key={company} variant="secondary">
                      {company}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {graduationYear && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>{graduationYear}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <AlumniProfileDialog
        name={name}
        role={role}
        companies={companies}
        bio={bio}
        familyBranch={familyBranch}
        graduationYear={graduationYear}
        location={location}
        bigBrother={bigBrother}
        littleBrothers={littleBrothers}
        linkedinUrl={linkedinUrl}
        email={email}
        phone={phone}
        major={major}
        minor={minor}
        members={members}
      />
    </Dialog>
  )
} 