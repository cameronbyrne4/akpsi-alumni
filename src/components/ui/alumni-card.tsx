import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Building2, Mail, Phone, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AlumniProfileDialog } from '@/components/ui/alumni-profile-dialog'
import { ContactIcons } from '@/components/ui/contact-icons'
import { formatLocation, getRandomAvatar } from '@/lib/utils'
import Image from 'next/image'
import { getCompanyColor } from '@/lib/company-colors'
import { useState, useEffect } from 'react'
import { familyColors } from '@/lib/family-colors'

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

// Reusable avatar component with fallback logic
export function ProfileAvatar({ name, pictureUrl, size = 80 }: { name: string; pictureUrl?: string | null; size?: number }) {
  const [imgSrc, setImgSrc] = useState(pictureUrl || getRandomAvatar(name));

  // Add this effect to update imgSrc when name or pictureUrl changes
  useEffect(() => {
    setImgSrc(pictureUrl || getRandomAvatar(name));
  }, [name, pictureUrl]);

  return (
    <span
      className="block rounded-full overflow-hidden bg-white border-4 border-white shadow-lg"
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={name}
        width={size}
        height={size}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        onError={() => setImgSrc(getRandomAvatar(name))}
      />
    </span>
  );
}

// Helper to get the most recent experience (matches dialog logic)
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

export function AlumniCard({
  name,
  pictureUrl,
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

  // Determine the best role and company to display (always matches dialog logic)
  let bestRole = role;
  let currentCompany = companies && companies.length > 0 ? companies[0] : null;
  if (hasEnrichment && careerHistory && careerHistory.length > 0) {
    const mostRecent = getMostRecentExperience(careerHistory);
    if (mostRecent) {
      bestRole = mostRecent.role;
      currentCompany = mostRecent.company;
    }
  }

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
              <ProfileAvatar name={name} pictureUrl={pictureUrl} size={80} />
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
        pictureUrl={pictureUrl || undefined}
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
      />
    </Dialog>
  )
}

export function AlumniCardContent({
  name,
  pictureUrl,
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

  // Determine the best role and company to display (always matches dialog logic)
  let bestRole = role;
  let currentCompany = companies && companies.length > 0 ? companies[0] : null;
  if (hasEnrichment && careerHistory && careerHistory.length > 0) {
    const mostRecent = getMostRecentExperience(careerHistory);
    if (mostRecent) {
      bestRole = mostRecent.role;
      currentCompany = mostRecent.company;
    }
  }

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
    <Card className="group relative overflow-hidden border-0 shadow-md bg-white hover:card-glow flex flex-col h-full w-80 h-[420px]">
      {/* New header section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-blue-200 to-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-white" />
        </div>
        
        {/* Avatar */}
        <div className="absolute top-16 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <ProfileAvatar name={name} pictureUrl={pictureUrl} size={80} />
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