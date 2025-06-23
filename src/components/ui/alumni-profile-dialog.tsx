import { DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Users, Mail, Phone, ExternalLink, BookOpen, Briefcase, Building2 } from 'lucide-react'
import { Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useState } from 'react'
import { getRandomAvatar } from '@/lib/utils'
import { ProfileAvatar } from './alumni-card'
import { familyColors } from '@/lib/family-colors'
import { getCompanyColor } from '@/lib/company-colors'

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
  pictureUrl?: string
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

// Helper to detect UCSB variants
function isUCSB(schoolName?: string | null): boolean {
  if (!schoolName) return false;
  const normalized = schoolName.toLowerCase().replace(/[-,]/g, '').replace(/\s+/g, ' ').trim();
  const variants = [
    'ucsb',
    'uc sb',
    'uc santa barbara',
    'university of california santa barbara',
    'university of california, santa barbara',
    'university of california -- santa barbara',
  ];
  return variants.some(v => normalized === v);
}

// Helper to get the most recent experience (matches accordion logic)
function getMostRecentExperience(careerHistory: CareerExperience[]): { role: string, company: string } | null {
  if (!careerHistory || careerHistory.length === 0) return null;
  const allRoles = [...careerHistory];
  const currentRoles = allRoles.filter(r => !r.end_date || r.end_date === 'Present');
  const pastRoles = allRoles.filter(r => r.end_date && r.end_date !== 'Present');
  currentRoles.sort((a, b) => new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime());
  pastRoles.sort((a, b) => {
    const endDiff = new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime();
    if (endDiff !== 0) return endDiff;
    return new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime();
  });
  const mostRecent = currentRoles[0] || pastRoles[0];
  if (!mostRecent) return null;
  return {
    role: mostRecent.title || '',
    company: mostRecent.company_name || ''
  };
}

export function AlumniProfileDialog({
  name,
  pictureUrl,
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
}: AlumniProfileDialogProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  // At the top of the dialog, use the most recent experience for role/company
  let bestRole = role;
  let currentCompany = companies && companies.length > 0 ? companies[0] : null;
  if (hasEnrichment && careerHistory && careerHistory.length > 0) {
    const mostRecent = getMostRecentExperience(careerHistory);
    if (mostRecent) {
      bestRole = mostRecent.role;
      currentCompany = mostRecent.company;
    }
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <ProfileAvatar name={name} pictureUrl={pictureUrl} size={96} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-3xl font-bold m-0 p-0 inline-block">{name}</h2>
              {familyBranch && (
                <span
                  className={`text-sm px-2 py-1 rounded font-semibold shadow-sm border ${
                    familyColors[familyBranch]?.border || 'border-gray-400'
                  } ${familyColors[familyBranch]?.bg || 'bg-gray-100'} ${familyColors[familyBranch]?.text || 'text-gray-700'}`}
                >
                  {familyBranch}
                </span>
              )}
            </div>
            <p className="text-lg text-muted-foreground mt-0.5 mb-0">
              {bestRole ? (
                <>
                  {bestRole}
                  {currentCompany && (
                    <div className="mt-0.5">
                      <span className="text-xs font-medium px-2 py-1 rounded border-0"
                        style={{
                          backgroundColor: getCompanyColor(currentCompany).bg,
                          color: getCompanyColor(currentCompany).text
                        }}
                      >
                        {currentCompany}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                'Role not specified'
              )}
            </p>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="flex flex-col gap-3 text-sm mb-6 mx-auto">
          <div className="flex items-center gap-12 truncate">
            <Mail className="h-4 w-4 text-green-600" />
            {email && email.length > 0 ? (
              <a href={`mailto:${email[0]}`}>{email[0]}</a>
            ) : <span className="text-muted-foreground">—</span>}
          </div>
          <div className="flex items-center gap-12 truncate">
            <Phone className="h-4 w-4 text-orange-500" />
            {phone && phone.length > 0 ? (
              <a href={`tel:${phone[0]}`}>{phone[0]}</a>
            ) : <span className="text-muted-foreground">—</span>}
          </div>
          <div className="flex items-center gap-12 truncate text-black/90">
            <MapPin className="h-4 w-4 text-red-500" />
            {location || <span className="text-muted-foreground">—</span>}
          </div>
          <div className="flex items-center gap-12 truncate">
            <Linkedin className="h-4 w-4 text-blue-500" />
            {linkedinUrl ? (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="underline max-w-[180px] inline-block align-middle truncate" title={linkedinUrl}>{linkedinUrl}</a>
            ) : <span className="text-muted-foreground">—</span>}
          </div>
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
              <h3 className="text-xl font-semibold">Experience</h3>
            </AccordionTrigger>
            <AccordionContent className="overflow-visible">
              <div className="space-y-4 pl-6">
                {hasEnrichedExperience ? (
                  // --- LinkedIn-style Experience Grouping ---
                  (() => {
                    // Group roles by company
                    const companyMap: Record<string, CareerExperience[]> = {};
                    careerHistory.forEach(exp => {
                      const key = exp.company_name || exp.company || 'Unknown';
                      if (!companyMap[key]) companyMap[key] = [];
                      companyMap[key].push(exp);
                    });

                    // Prepare company groups
                    const companyGroups = Object.entries(companyMap).map(([company, roles]) => {
                      // Split into current and past roles
                      const currentRoles = roles.filter(r => !r.end_date || r.end_date === 'Present');
                      const pastRoles = roles.filter(r => r.end_date && r.end_date !== 'Present');

                      // Sort current roles by most recent start date (desc)
                      currentRoles.sort((a, b) => new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime());
                      // Sort past roles by most recent end date (desc), then start date (desc)
                      pastRoles.sort((a, b) => {
                        const endDiff = new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime();
                        if (endDiff !== 0) return endDiff;
                        return new Date(b.start_date || '').getTime() - new Date(a.start_date || '').getTime();
                      });

                      // For company sorting: get most recent start date among current, or most recent end date among past
                      const mostRecentCurrentStart = currentRoles[0]?.start_date ? new Date(currentRoles[0].start_date).getTime() : null;
                      const mostRecentPastEnd = pastRoles[0]?.end_date ? new Date(pastRoles[0].end_date).getTime() : null;

                      return {
                        company,
                        logo: roles[0].company_logo || '/avatars/bizsamp.png',
                        badgeColor: getCompanyColor(company),
                        currentRoles,
                        pastRoles,
                        mostRecentCurrentStart,
                        mostRecentPastEnd,
                      };
                    });

                    // Sort companies: current roles first (by most recent current start), then past (by most recent past end)
                    companyGroups.sort((a, b) => {
                      if (a.currentRoles.length && b.currentRoles.length) {
                        return (b.mostRecentCurrentStart || 0) - (a.mostRecentCurrentStart || 0);
                      }
                      if (a.currentRoles.length) return -1;
                      if (b.currentRoles.length) return 1;
                      return (b.mostRecentPastEnd || 0) - (a.mostRecentPastEnd || 0);
                    });

                    // Render
                    return companyGroups.map((group, idx) => (
                      <div key={group.company + idx} className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={group.logo}
                            alt={group.company}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 bg-white"
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatars/bizsamp.png'; }}
                          />
                          <span
                            className="text-xs font-medium px-2 py-1 rounded border-0"
                            style={{ backgroundColor: group.badgeColor.bg, color: group.badgeColor.text }}
                          >
                            {group.company}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {[...group.currentRoles, ...group.pastRoles].map((exp, i) => (
                            <div key={i} className="ml-2 pl-2 border-l-2 border-gray-200">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm mb-0">{exp.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                              </p>
                              {exp.description && (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap mb-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                ) : hasScrapedExperience ? (
                  scrapedExperiences.map((exp, index) => (
                    <div key={index} className="flex gap-4 relative">
                      <div className="h-8 w-8 absolute -left-[53px] top-0 flex items-center justify-center">
                        <img
                          src={'/avatars/bizsamp.png'}
                          alt={exp.company || 'Company'}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200 bg-white"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-x-2">
                          <p className="font-semibold text-sm">{exp.position}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm">@</span>
                            {(() => {
                              const { bg, text } = getCompanyColor(exp.company);
                              return (
                                <span
                                  className="text-xs font-medium px-2 py-1 rounded border-0"
                                  style={{ backgroundColor: bg, color: text }}
                                >
                                  {exp.company}
                                </span>
                              );
                            })()}
                          </div>
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
              <h3 className="text-xl font-semibold">Education</h3>
            </AccordionTrigger>
            <AccordionContent className="overflow-visible">
              <div className="space-y-4 pl-6">
                {graduationYear ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={'/avatars/edusamp.png'}
                        alt={'School'}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200 bg-white"
                      />
                      <span
                        className="text-xs font-medium px-2 py-1 rounded border-0"
                        style={{ backgroundColor: '#003761', color: '#fcbb17' }}
                      >
                        UC Santa Barbara
                      </span>
                    </div>
                    <div className="pl-10">
                      <p className="text-xs text-muted-foreground mb-0">Class of {graduationYear}</p>
                      {(major && major.length > 0 || minor && minor.length > 0) ? (
                        <p className="text-xs text-muted-foreground mb-0">
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
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <img
                            src={edu.school_logo || '/avatars/edusamp.png'}
                            alt={edu.school_name || 'School'}
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 bg-white"
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatars/edusamp.png'; }}
                          />
                          <span
                            className="text-xs font-medium px-2 py-1 rounded border-0"
                            style={isUCSB(edu.school_name)
                              ? { backgroundColor: '#003761', color: '#fcbb17' }
                              : { backgroundColor: '#f3f4f6', color: '#374151' }}
                          >
                            {edu.school_name}
                          </span>
                        </div>
                        <div className="pl-10">
                          <p className="text-xs text-muted-foreground mb-0">{edu.degree}, {edu.field_of_study}</p>
                          <p className="text-xs text-muted-foreground mb-0">
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={'/avatars/edusamp.png'}
                          alt={'School'}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200 bg-white"
                        />
                        <span
                          className="text-xs font-medium px-2 py-1 rounded border-0"
                          style={{ backgroundColor: '#003761', color: '#fcbb17' }}
                        >
                          UC Santa Barbara
                        </span>
                      </div>
                      <div className="pl-10">
                        {(major && major.length > 0 || minor && minor.length > 0) ? (
                          <p className="text-xs text-muted-foreground mb-0">
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
        </Accordion>
      </div>
    </DialogContent>
  )
} 