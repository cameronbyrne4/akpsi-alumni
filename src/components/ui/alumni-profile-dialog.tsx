import { DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Users, Mail, Phone, ExternalLink, BookOpen, Briefcase, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useState } from 'react'

// Interfaces for enriched data
interface CareerExperience {
  title?: string;
  company_name?: string;
  company?: string;
  start_date?: string;
  end_date?: string | null;
  description?: string;
  location?: string;
  company_logo?: string;
  bio?: string;
  experiences?: Array<{
    company: string;
    duration: string;
    location: string;
    position: string;
    description: string | null;
  }>;
}

interface Education {
  degree: string;
  field_of_study: string;
  school_name: string;
  school_logo?: string;
  start_date: string;
  end_date: string | null;
  description?: string;
}

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
  email?: string[] | null
  phone?: string[] | null
  major?: string[] | null
  minor?: string[] | null
  members?: Array<{ id: string; name:string }>
  hasEnrichment?: boolean
  scraped?: boolean
  careerHistory?: CareerExperience[]
  education?: Education[]
  currentCompany?: string | null
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString || dateString === 'Present') return 'Present';
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() < 1971) {
    return 'Present'
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatYear = (dateString: string | null | undefined) => {
  if (!dateString || dateString === 'Present') return 'Present';
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() < 1971) {
    return '';
  }
  return date.getFullYear();
};

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
  email = [],
  phone = [],
  major,
  minor,
  members = [],
  hasEnrichment = false,
  scraped = false,
  careerHistory = [],
  education = [],
  currentCompany,
}: AlumniProfileDialogProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const getNameFromId = (id: string) => {
    const member = members.find(m => m.id === id);
    return member?.name || 'Unknown';
  };

  // --- Start of new logic ---
  // Helper to safely get scraped bio, handling both object and array formats for careerHistory
  const getScrapedBio = () => {
    if (scraped && !hasEnrichment && careerHistory) {
      const history = Array.isArray(careerHistory) ? careerHistory[0] : careerHistory;
      return (history as CareerExperience)?.bio || null;
    }
    return null;
  };
  
  // Helper to safely get scraped experiences
  const getScrapedExperiences = () => {
    if (scraped && !hasEnrichment && careerHistory) {
      const history = Array.isArray(careerHistory) ? careerHistory[0] : careerHistory;
      return (history as CareerExperience)?.experiences || null;
    }
    return null;
  }

  const displayBio = bio || getScrapedBio();
  const scrapedExperiences = getScrapedExperiences();

  const hasEnrichedExperience = hasEnrichment && Array.isArray(careerHistory) && careerHistory.length > 0 && careerHistory.every(c => c.title && (c.company_name || c.company));
  const hasScrapedExperience = !!scrapedExperiences;
  const hasEnrichedEducation = hasEnrichment && education && education.length > 0;
  // --- End of new logic ---

  return (
    <DialogContent className="max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="relative h-24 w-24 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            <span className="text-3xl font-semibold text-primary">{initials}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{name}</h2>
            <p className="text-lg text-muted-foreground mt-1">
              {role ? (
                <>
                  {role}
                  {currentCompany && <span className="text-muted-foreground/80"> @ {currentCompany}</span>}
                </>
              ) : (
                'Role not specified'
              )}
            </p>
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
          </div>
          {familyBranch && (
            <Badge variant="outline" className="text-sm">{familyBranch}</Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {email && email.length > 0 && (
            <a href={`mailto:${email[0]}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-4 w-4" />
              <span>{email[0]}</span>
            </a>
          )}
          {phone && phone.length > 0 && (
            <a href={`tel:${phone[0]}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
              <span>{phone[0]}</span>
            </a>
          )}
          {linkedinUrl && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> LinkedIn
              </a>
            </Button>
          )}
        </div>

        <Accordion type="multiple" defaultValue={['about', 'experience', 'education', 'family']} className="w-full [&_[data-state=open]]:border-none">
          {/* Bio */}
          {displayBio && (
            <AccordionItem value="about" className="border-none">
              <AccordionTrigger className="hover:no-underline [&[data-state=open]]:border-none">
                <h3 className="text-xl font-semibold">About</h3>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayBio}</p>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Experience */}
          <AccordionItem value="experience" className="border-none">
            <AccordionTrigger className="hover:no-underline [&[data-state=open]]:border-none">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Experience
              </h3>
            </AccordionTrigger>
            <AccordionContent className="overflow-visible">
              <div className="space-y-4 pl-16">
                {hasEnrichedExperience ? (
                  careerHistory.map((exp, index) => (
                    <div key={index} className="flex gap-4 relative">
                      <div className="h-8 w-8 absolute -left-[53px] top-0 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {(exp.company_name || exp.company)?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-x-2">
                          <p className="font-semibold text-sm">{exp.title}</p>
                          <p className="text-sm text-muted-foreground">@ {exp.company_name || exp.company}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : hasScrapedExperience ? (
                  scrapedExperiences.map((exp, index) => (
                    <div key={index} className="flex gap-4 relative">
                      <div className="h-8 w-8 absolute -left-[53px] top-0 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {exp.company?.charAt(0).toUpperCase()}
                          </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-x-2">
                          <p className="font-semibold text-sm">{exp.position}</p>
                          <p className="text-sm text-muted-foreground">@ {exp.company}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{exp.duration}</p>
                      </div>
                    </div>
                  ))
                ) : companies && companies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {companies.map((company) => (
                      <Badge key={company} variant="secondary">{company}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No experience listed.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Education */}
          <AccordionItem value="education" className="border-none">
            <AccordionTrigger className="hover:no-underline [&[data-state=open]]:border-none">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Education
              </h3>
            </AccordionTrigger>
            <AccordionContent className="overflow-visible">
              <div className="space-y-4 pl-16">
                {graduationYear ? (
                  <div className="flex gap-4 relative">
                    <div className="h-8 w-8 absolute -left-[53px] top-0 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-semibold text-muted-foreground">U</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">UC Santa Barbara</p>
                      <p className="text-xs text-muted-foreground">Class of {graduationYear}</p>
                      {(major && major.length > 0 || minor && minor.length > 0) ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {major && major.length > 0 ? `Major in ${major.join(', ')}` : ''}
                          {major && major.length > 0 && minor && minor.length > 0 ? '. ' : ''}
                          {minor && minor.length > 0 ? `Minor in ${minor.join(', ')}` : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : hasEnrichedEducation ? (
                  education.filter(edu => edu.start_date && edu.start_date !== '1970-01-01' && edu.start_date !== '1970-01-01T00:00:00').length > 0 ? (
                    education.filter(edu => edu.start_date && edu.start_date !== '1970-01-01' && edu.start_date !== '1970-01-01T00:00:00').map((edu, index) => (
                      <div key={index} className="flex gap-4 relative">
                        <div className="h-8 w-8 absolute -left-[53px] top-0 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-semibold text-muted-foreground">{edu.school_name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{edu.school_name}</p>
                          <p className="text-xs text-muted-foreground">{edu.degree}, {edu.field_of_study}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatYear(edu.start_date)} - {edu.end_date === 'Present' ? 'Present' : formatYear(edu.end_date)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No education details available.</p>
                  )
                ) : (
                  (major && major.length > 0 || minor && minor.length > 0) ? (
                    <div className="flex gap-4 relative">
                      <div className="h-8 w-8 absolute -left-[53px] top-0 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">U</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">UC Santa Barbara</p>
                        {(major && major.length > 0 || minor && minor.length > 0) ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {major && major.length > 0 ? `Major in ${major.join(', ')}` : ''}
                            {major && major.length > 0 && minor && minor.length > 0 ? '. ' : ''}
                            {minor && minor.length > 0 ? `Minor in ${minor.join(', ')}` : ''}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No education details available.</p>
                  )
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Family */}
          <AccordionItem value="family" className="border-none">
            <AccordionTrigger className="hover:no-underline [&[data-state=open]]:border-none">
              <h3 className="text-xl font-semibold">Family</h3>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 text-sm pt-2">
                {familyBranch && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{familyBranch} Branch</span>
                  </div>
                )}
                {bigBrother && (
                  <p><span className="text-muted-foreground">Big:</span> {getNameFromId(bigBrother)}</p>
                )}
                {littleBrothers && littleBrothers.length > 0 && (
                  <p><span className="text-muted-foreground">Littles:</span> {littleBrothers.map(id => getNameFromId(id)).join(', ')}</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DialogContent>
  )
} 