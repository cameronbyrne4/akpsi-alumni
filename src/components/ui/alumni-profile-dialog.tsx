import { DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Users, Mail, Phone, Link, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface AlumniProfileDialogProps {
  name: string
  role?: string | null
  companies?: string[]
  bio?: string | null
  familyBranch?: string | null
  graduationYear?: number | null
  location?: string | null
  bigBrother?: string | null
  littleBrothers?: string[] | null
  linkedinUrl?: string | null
  email?: string | null
  phone?: string | null
  major?: string | null
  minor?: string | null
}

export function AlumniProfileDialog({
  name,
  role,
  companies = [],
  bio,
  familyBranch,
  graduationYear,
  location,
  bigBrother,
  littleBrothers = [],
  linkedinUrl,
  email,
  phone,
  major,
  minor,
}: AlumniProfileDialogProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <DialogContent className="max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="relative h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary">{initials}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{name}</h2>
            {role ? (
              <p className="text-lg text-muted-foreground">{role}</p>
            ) : (
              <p className="text-lg text-muted-foreground">Role 🤷‍♂️</p>
            )}
            {location ? (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>Location 🤷‍♂️</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4">
          {email ? (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={`mailto:${email}`}>
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Mail className="h-4 w-4" />
              Email 🤷‍♂️
            </Button>
          )}
          {phone ? (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={`tel:${phone}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Phone className="h-4 w-4" />
              Phone 🤷‍♂️
            </Button>
          )}
          {linkedinUrl ? (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                <Link className="h-4 w-4" />
                LinkedIn
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Link className="h-4 w-4" />
              LinkedIn 🤷‍♂️
            </Button>
          )}
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-lg font-semibold mb-2">About</h3>
          {bio ? (
            <p className="text-muted-foreground">{bio}</p>
          ) : (
            <p className="text-muted-foreground">No bio available 🤷‍♂️</p>
          )}
        </div>

        {/* Experience */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Experience</h3>
          {companies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {companies.map((company) => (
                <Badge key={company} variant="secondary">
                  {company}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No companies listed 🤷‍♂️</p>
          )}
        </div>

        {/* Education */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Education</h3>
          <div className="space-y-2">
            {graduationYear ? (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>Class of {graduationYear}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>Graduation Year 🤷‍♂️</span>
              </div>
            )}
            {major ? (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{major}{minor ? `, ${minor}` : ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>Major/Minor 🤷‍♂️</span>
              </div>
            )}
          </div>
        </div>

        {/* Family */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Family</h3>
          <div className="space-y-2">
            {familyBranch ? (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{familyBranch}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Family Branch 🤷‍♂️</span>
              </div>
            )}
            {bigBrother ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Big:</span>
                <span>{bigBrother}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Big:</span>
                <span>🤷‍♂️</span>
              </div>
            )}
            {littleBrothers && littleBrothers.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Littles:</span>
                <span>{littleBrothers.join(', ')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Littles:</span>
                <span>🤷‍♂️</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  )
} 