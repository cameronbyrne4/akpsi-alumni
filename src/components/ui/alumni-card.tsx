import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, GraduationCap, Building2, Mail, Phone, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { AlumniProfileDialog } from '@/components/ui/alumni-profile-dialog'

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

  // Determine the best role to display based on enrichment level
  const getBestRole = () => {
    // Enriched profiles should use the role column first
    if (hasEnrichment && role) {
      return role;
    }
    
    if (hasEnrichment && careerHistory && careerHistory.length > 0) {
      // Use most recent career history title as fallback
      const currentRole = careerHistory.find((exp: CareerExperience) => exp.end_date === 'Present' || exp.end_date === null);
      if (currentRole?.title) return currentRole.title;
      return careerHistory[0]?.title || role;
    }
    
    if (scraped && careerHistory && careerHistory.length > 0) {
      // For scraped but not enriched, look for experiences array
      const experiences = careerHistory.find((exp: CareerExperience) => exp.experiences);
      if (experiences?.experiences && experiences.experiences.length > 0) {
        const currentExp = experiences.experiences.find(exp => exp.duration?.includes('Present') || exp.duration?.includes('to 2024'));
        if (currentExp?.position) return currentExp.position;
        return experiences.experiences[0]?.position || role;
      }
    }
    
    return role;
  };

  // Get the most current company
  const getCurrentCompany = () => {
    if (hasEnrichment && careerHistory && careerHistory.length > 0) {
      const currentExp = careerHistory.find(exp => exp.end_date === 'Present' || exp.end_date === null);
      if (currentExp?.company_name) return currentExp.company_name;
      return careerHistory[0]?.company_name || null;
    }
    if (scraped && careerHistory && careerHistory.length > 0) {
      const experiences = (Array.isArray(careerHistory) ? careerHistory[0] : careerHistory)?.experiences;
      if (experiences && experiences.length > 0) {
        const currentExp = experiences.find(exp => exp.duration?.includes('Present'));
        if (currentExp?.company) return currentExp.company;
        return experiences[0]?.company || null;
      }
    }
    return companies && companies.length > 0 ? companies[0] : null;
  };

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

  const bestRole = getBestRole();
  const currentCompany = getCurrentCompany();
  const bestCompanies = getBestCompanies();
  const bestBio = getBestBio();
  const bestEducation = getBestEducation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
          {/* Header with gradient background */}
          <div className="relative h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            
            {/* Profile section */}
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                  <span className="text-lg font-bold text-primary">
                    {initials}
                  </span>
                </div>
                
                {/* Name and role */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                  {bestRole && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {bestRole}
                      {currentCompany && ` @ ${currentCompany}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-6 pt-4">
            <div className="space-y-4">
              {/* Companies */}
              {bestCompanies && bestCompanies.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Building2 className="h-3 w-3" />
                    <span>Experience</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bestCompanies.slice(0, 3).map((company: string) => (
                      <Badge key={company} variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
                        {company}
                      </Badge>
                    ))}
                    {bestCompanies.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-1 text-gray-500">
                        +{bestCompanies.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Location and graduation */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                {location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
                {graduationYear && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                    <span>Class of {graduationYear}</span>
                  </div>
                )}
              </div>

              {/* Contact indicators */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                {email && email.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Mail className="h-3 w-3" />
                    <span>Email</span>
                  </div>
                )}
                {phone && phone.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Phone className="h-3 w-3" />
                    <span>Phone</span>
                  </div>
                )}
                {linkedinUrl && (
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <ExternalLink className="h-3 w-3" />
                    <span>LinkedIn</span>
                  </div>
                )}
              </div>

              {/* Family branch indicator */}
              {familyBranch && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-white/80 backdrop-blur-sm border-primary/20 text-primary">
                    {familyBranch}
                  </Badge>
                </div>
              )}
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