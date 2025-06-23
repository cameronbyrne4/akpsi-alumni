import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Building2, Mail, Phone, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AlumniProfileDialog } from '@/components/ui/alumni-profile-dialog'
import { ContactIcons } from '@/components/ui/contact-icons'
import { formatLocation, getRandomAvatar } from '@/lib/utils'
import Image from 'next/image'
import { getCompanyColor } from '@/lib/company-colors'

// Pastel color mapping for family branches
const familyColors: Record<string, { bg: string; text: string; border: string }> = {
  Paahana: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-800' },
  Magpantay: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-800' },
  Brecek: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-800' },
  Brugos: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-800' },
  Cauntay: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-800' },
  Johnson: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-800' },
  Chou: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-800' },
  Heller: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-800' },
  Li: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-800' },
};

function CompanyBadge({ company }: { company: string }) {
  const { bg, text } = getCompanyColor(company)

  return (
    <Badge
      style={{ backgroundColor: bg, color: text }}
      className="text-xs font-medium px-2 py-1 border-0"
    >
      {company}
    </Badge>
  )
}

interface CareerExperience {
  title: string;
  company_name: string;
  start_date: string;
  end_date: string | null;
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
  hasEnrichment?: boolean
  scraped?: boolean
  careerHistory?: CareerExperience[]
  education?: Education[]
  showFamilyBranch?: boolean
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
  email = [],
  phone = [],
  major,
  minor,
  members = [],
  hasEnrichment = false,
  scraped = false,
  careerHistory = [],
  education = [],
}: AlumniCardProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  // Determine the best role and company to display
  const { role: bestRole, company: currentCompany } = (() => {
    // Handle enriched profiles with career history
    if (hasEnrichment && careerHistory && careerHistory.length > 0) {
      const currentExperiences = careerHistory.filter(
        (exp) => exp.end_date === 'Present' || exp.end_date === null
      );

      if (currentExperiences.length > 0) {
        // If there are multiple current roles, sort by start date to find the most recent one.
        if (currentExperiences.length > 1) {
          currentExperiences.sort((a, b) => {
            try {
              return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
            } catch (e) {
              return 0; // Don't sort if dates are invalid
            }
          });
        }
        const mostRecentExperience = currentExperiences[0];
        return { role: mostRecentExperience.title, company: mostRecentExperience.company_name };
      }
      
      const mostRecentExperience = careerHistory[0];
      if (mostRecentExperience) {
        return { role: mostRecentExperience.title, company: mostRecentExperience.company_name };
      }
    }

    // Handle scraped profiles
    if (scraped && careerHistory && careerHistory.length > 0) {
      const experiencesList = (Array.isArray(careerHistory) ? careerHistory[0] : careerHistory)?.experiences;
      if (experiencesList && experiencesList.length > 0) {
        const presentExperiences = experiencesList.filter(exp => exp.duration?.includes('Present'));
        const experienceToShow = presentExperiences.length > 0 ? presentExperiences[0] : experiencesList[0];
        if (experienceToShow) {
          return { role: experienceToShow.position, company: experienceToShow.company };
        }
      }
    }

    // Fallback to top-level props if no career history
    return { role, company: companies && companies.length > 0 ? companies[0] : null };
  })();

  // Determine the best companies to display based on enrichment level
  const getBestCompanies = () => {
    if (hasEnrichment && careerHistory && careerHistory.length > 0) {
      // Use career history company names and deduplicate
      const companyNames = careerHistory.map((exp: CareerExperience) => exp.company_name).filter((company): company is string => Boolean(company));
      return [...new Set(companyNames)]; // Remove duplicates
    }
    
    if (scraped && careerHistory && careerHistory.length > 0) {
      // For scraped but not enriched, look for experiences array
      const experiences = careerHistory.find((exp: CareerExperience) => exp.experiences);
      if (experiences?.experiences && experiences.experiences.length > 0) {
        const companyNames = experiences.experiences.map(exp => exp.company).filter((company): company is string => Boolean(company));
        return [...new Set(companyNames)]; // Remove duplicates
      }
    }
    
    // For manual companies array, also deduplicate
    return companies ? [...new Set(companies)] : [];
  };

  // Get the best bio to display
  const getBestBio = () => {
    if (hasEnrichment && bio) {
      return bio;
    }
    
    if (scraped && careerHistory && careerHistory.length > 0) {
      // Look for bio in career history
      const bioEntry = careerHistory.find((exp: CareerExperience) => exp.bio);
      if (bioEntry?.bio) return bioEntry.bio;
    }
    
    return bio;
  };

  // Get the best education to display
  const getBestEducation = () => {
    if (hasEnrichment && education && education.length > 0) {
      // Use education column for enriched profiles
      return education.map((edu: Education) => `${edu.degree} in ${edu.field_of_study} from ${edu.school_name}`);
    }
    
    // For non-enriched profiles, use majors and minors
    const educationParts = [];
    if (major && major.length > 0) {
      educationParts.push(`Major: ${major.join(', ')}`);
    }
    if (minor && minor.length > 0) {
      educationParts.push(`Minor: ${minor.join(', ')}`);
    }
    return educationParts;
  };

  const bestCompanies = getBestCompanies();
  const bestBio = getBestBio();
  const bestEducation = getBestEducation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 border-0 bg-white hover:card-glow flex flex-col h-full">
          {/* New header section */}
          <div className="relative">
            {/* Banner */}
            <div className="h-16 bg-gradient-to-r from-blue-200 to-white">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-white" />
            </div>
            
            {/* Avatar */}
            <div className="absolute top-16 left-1/2 -translate-y-1/2 -translate-x-1/2">
              <div className="relative h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                <Image
                  src={getRandomAvatar(name)}
                  alt={name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                />
              </div>
            </div>
            
            {/* Graduation Year Badge */}
            {graduationYear && (
              <div className="absolute top-3 left-3">
                <Badge variant="outline" className="text-xs px-2 py-1 bg-white/80 backdrop-blur-sm border-primary/20 text-primary">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {graduationYear}
                </Badge>
              </div>
            )}
            
            {/* Family Branch Badge */}
            {familyBranch && (
              <div className="absolute top-3 right-3">
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold shadow-sm border ${
                    familyColors[familyBranch]?.border || 'border-gray-400'
                  } ${familyColors[familyBranch]?.bg || 'bg-gray-100'} ${familyColors[familyBranch]?.text || 'text-gray-700'}`}
                >
                  {familyBranch}
                </span>
              </div>
            )}
          </div>

          {/* New content section */}
          <CardContent className="p-6 pt-12 flex flex-col flex-grow text-center">
            {/* Name and Role */}
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
              {name}
            </h3>
            {bestRole && (
              <p className="text-sm text-gray-600 mt-1">
                {bestRole}
                {currentCompany && ` @ ${currentCompany}`}
              </p>
            )}

            {/* Middle content that grows */}
            <div className="flex-grow pt-4">
              {/* Companies */}
              {bestCompanies && bestCompanies.length > 0 && (
                <div className="space-y-2 text-left mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Building2 className="h-3 w-3" />
                    <span>Companies</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bestCompanies.slice(0, 3).map((company: string) => (
                      <CompanyBadge key={company} company={company} />
                    ))}
                    {bestCompanies.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-1 text-gray-500">
                        +{bestCompanies.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom line: Contact, Location, Grad Year */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <ContactIcons 
                hasEmail={!!email && email.length > 0}
                hasPhone={!!phone && phone.length > 0}
                hasLinkedin={!!linkedinUrl}
              />
              <div className="flex items-center gap-2">
                {location && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-0 max-w-40">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate" title={location}>{formatLocation(location)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <AlumniProfileDialog
        name={name}
        role={bestRole}
        companies={bestCompanies}
        bio={bestBio}
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
        hasEnrichment={hasEnrichment}
        scraped={scraped}
        careerHistory={careerHistory}
        education={education}
        currentCompany={currentCompany}
      />
    </Dialog>
  )
}

export function AlumniCardContent({
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
  email = [],
  phone = [],
  major,
  minor,
  members = [],
  hasEnrichment = false,
  scraped = false,
  careerHistory = [],
  education = [],
  showFamilyBranch = true,
}: AlumniCardProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  // Determine the best role and company to display
  const { role: bestRole, company: currentCompany } = (() => {
    // Handle enriched profiles with career history
    if (hasEnrichment && careerHistory && careerHistory.length > 0) {
      const currentExperiences = careerHistory.filter(
        (exp) => exp.end_date === 'Present' || exp.end_date === null
      );

      if (currentExperiences.length > 0) {
        // If there are multiple current roles, sort by start date to find the most recent one.
        if (currentExperiences.length > 1) {
          currentExperiences.sort((a, b) => {
            try {
              return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
            } catch (e) {
              return 0; // Don't sort if dates are invalid
            }
          });
        }
        const mostRecentExperience = currentExperiences[0];
        return { role: mostRecentExperience.title, company: mostRecentExperience.company_name };
      }
      
      const mostRecentExperience = careerHistory[0];
      if (mostRecentExperience) {
        return { role: mostRecentExperience.title, company: mostRecentExperience.company_name };
      }
    }

    // Handle scraped profiles
    if (scraped && careerHistory && careerHistory.length > 0) {
      const experiencesList = (Array.isArray(careerHistory) ? careerHistory[0] : careerHistory)?.experiences;
      if (experiencesList && experiencesList.length > 0) {
        const presentExperiences = experiencesList.filter(exp => exp.duration?.includes('Present'));
        const experienceToShow = presentExperiences.length > 0 ? presentExperiences[0] : experiencesList[0];
        if (experienceToShow) {
          return { role: experienceToShow.position, company: experienceToShow.company };
        }
      }
    }

    // Fallback to top-level props if no career history
    return { role, company: companies && companies.length > 0 ? companies[0] : null };
  })();

  // Determine the best companies to display based on enrichment level
  const getBestCompanies = () => {
    if (hasEnrichment && careerHistory && careerHistory.length > 0) {
      // Use career history company names and deduplicate
      const companyNames = careerHistory.map((exp: CareerExperience) => exp.company_name).filter((company): company is string => Boolean(company));
      return [...new Set(companyNames)]; // Remove duplicates
    }
    
    if (scraped && careerHistory && careerHistory.length > 0) {
      // For scraped but not enriched, look for experiences array
      const experiences = careerHistory.find((exp: CareerExperience) => exp.experiences);
      if (experiences?.experiences && experiences.experiences.length > 0) {
        const companyNames = experiences.experiences.map(exp => exp.company).filter((company): company is string => Boolean(company));
        return [...new Set(companyNames)]; // Remove duplicates
      }
    }
    
    // For manual companies array, also deduplicate
    return companies ? [...new Set(companies)] : [];
  };

  // Get the best bio to display
  const getBestBio = () => {
    if (hasEnrichment && bio) {
      return bio;
    }
    
    if (scraped && careerHistory && careerHistory.length > 0) {
      // Look for bio in career history
      const bioEntry = careerHistory.find((exp: CareerExperience) => exp.bio);
      if (bioEntry?.bio) return bioEntry.bio;
    }
    
    return bio;
  };

  // Get the best education to display
  const getBestEducation = () => {
    if (hasEnrichment && education && education.length > 0) {
      // Use education column for enriched profiles
      return education.map((edu: Education) => `${edu.degree} in ${edu.field_of_study} from ${edu.school_name}`);
    }
    
    // For non-enriched profiles, use majors and minors
    const educationParts = [];
    if (major && major.length > 0) {
      educationParts.push(`Major: ${major.join(', ')}`);
    }
    if (minor && minor.length > 0) {
      educationParts.push(`Minor: ${minor.join(', ')}`);
    }
    return educationParts;
  };

  const bestCompanies = getBestCompanies();
  const bestBio = getBestBio();
  const bestEducation = getBestEducation();

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md bg-white hover:card-glow flex flex-col h-full">
      {/* New header section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-blue-200 to-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-white" />
        </div>
        
        {/* Avatar */}
        <div className="absolute top-16 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <div className="relative h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
            <Image
              src={getRandomAvatar(name)}
              alt={name}
              layout="fill"
              objectFit="cover"
              className="rounded-full"
            />
          </div>
        </div>
        
        {/* Graduation Year Badge */}
        {graduationYear && (
          <div className="absolute top-3 left-3">
            <Badge variant="outline" className="text-xs px-2 py-1 bg-white/80 backdrop-blur-sm border-primary/20 text-primary">
              <GraduationCap className="h-3 w-3 mr-1" />
              {graduationYear}
            </Badge>
          </div>
        )}
        
        {/* Family Branch Badge */}
        {familyBranch && showFamilyBranch && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs px-2 py-1 rounded font-semibold shadow-sm border ${
                familyColors[familyBranch]?.border || 'border-gray-400'
              } ${familyColors[familyBranch]?.bg || 'bg-gray-100'} ${familyColors[familyBranch]?.text || 'text-gray-700'}`}
            >
              {familyBranch}
            </span>
          </div>
        )}
      </div>

      {/* New content section */}
      <CardContent className="p-6 pt-12 flex flex-col flex-grow text-center">
        {/* Name and Role */}
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
          {name}
        </h3>
        {bestRole && (
          <p className="text-sm text-gray-600 mt-1">
            {bestRole}
            {currentCompany && ` @ ${currentCompany}`}
          </p>
        )}

        {/* Middle content that grows */}
        <div className="flex-grow pt-4">
          {/* Companies */}
          {bestCompanies && bestCompanies.length > 0 && (
            <div className="space-y-2 text-left mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <Building2 className="h-3 w-3" />
                <span>Experience</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bestCompanies.slice(0, 3).map((company: string) => (
                  <CompanyBadge key={company} company={company} />
                ))}
                {bestCompanies.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1 text-gray-500">
                    +{bestCompanies.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom line: Contact, Location, Grad Year */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <ContactIcons 
            hasEmail={!!email && email.length > 0}
            hasPhone={!!phone && phone.length > 0}
            hasLinkedin={!!linkedinUrl}
          />
          <div className="flex items-center gap-2">
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-0 max-w-40">
                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate" title={location}>{formatLocation(location)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 