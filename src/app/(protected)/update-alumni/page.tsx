"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alumni } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, PlusCircle, Pencil, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper to format dates for display
const formatDate = (dateString: string | undefined | null) => {
  if (!dateString || dateString === 'Present') return 'Present';
  try {
    const date = new Date(dateString);
    // Use UTC methods to avoid timezone issues
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch (e) {
    return dateString; // Return original string if parsing fails
  }
};

const formatEducationDate = (dateString: string | undefined | null) => {
  if (!dateString || dateString === 'Present') return 'Present';
  try {
    const date = new Date(dateString);
    return date.getUTCFullYear().toString();
  } catch (e) {
    return dateString; // Return original string if parsing fails
  }
};

// Experience Form Component
const ExperienceForm = ({
  isOpen,
  onClose,
  onSave,
  experience,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (experience: any) => void;
  experience: any | null;
}) => {
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [isCurrentRole, setIsCurrentRole] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (isOpen && experience) {
      setTitle(experience.title || '');
      setCompanyName(experience.company_name || '');
      setLocation(experience.location || '');
      setDescription(experience.description || '');

      const isCurrent = experience.end_date === 'Present' || !experience.end_date;
      setIsCurrentRole(isCurrent);

      if (experience.start_date) {
        const startDate = new Date(experience.start_date);
        setStartMonth((startDate.getUTCMonth() + 1).toString());
        setStartYear(startDate.getUTCFullYear().toString());
      } else {
        setStartMonth('');
        setStartYear('');
      }

      if (!isCurrent && experience.end_date) {
        const endDate = new Date(experience.end_date);
        setEndMonth((endDate.getUTCMonth() + 1).toString());
        setEndYear(endDate.getUTCFullYear().toString());
      } else {
        setEndMonth('');
        setEndYear('');
      }
    } else if (isOpen) {
      // Reset form for new experience
      setTitle('');
      setCompanyName('');
      setLocation('');
      setIsCurrentRole(false);
      setStartMonth('');
      setStartYear('');
      setEndMonth('');
      setEndYear('');
      setDescription('');
    }
  }, [isOpen, experience]);

  const handleSave = () => {
    if (!title || !companyName || !startMonth || !startYear) {
      // Basic validation
      alert('Please fill in all required fields.');
      return;
    }

    const experienceData = {
      title,
      company_name: companyName,
      location,
      description,
      start_date: new Date(Date.UTC(parseInt(startYear), parseInt(startMonth) - 1, 1)).toISOString(),
      end_date: isCurrentRole ? 'Present' : new Date(Date.UTC(parseInt(endYear), parseInt(endMonth) - 1, 1)).toISOString(),
      company_logo: experience?.company_logo || '', // Preserve existing logo
    };
    onSave(experienceData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>{experience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title*</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Retail Sales Manager" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company or organization*</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Microsoft" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: San Francisco, CA" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="currentRole" checked={isCurrentRole} onCheckedChange={(checked) => setIsCurrentRole(checked as boolean)} />
            <Label htmlFor="currentRole">They are currently working in this role</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start date*</Label>
              <div className="flex gap-2">
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={startYear} onValueChange={setStartYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!isCurrentRole && (
              <div className="space-y-2">
                <Label>End date*</Label>
                <div className="flex gap-2">
                  <Select value={endMonth} onValueChange={setEndMonth}>
                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={endYear} onValueChange={setEndYear}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Describe their role and accomplishments." className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-transparent" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Education Form Component
const EducationForm = ({
  isOpen,
  onClose,
  onSave,
  education,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (education: any) => void;
  education: any | null;
}) => {
  const [schoolName, setSchoolName] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');

  const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (isOpen && education) {
      setSchoolName(education.school_name || '');
      setDegree(education.degree || '');
      setFieldOfStudy(education.field_of_study || '');
      setDescription(education.description || '');

      if (education.start_date) {
        setStartYear(new Date(education.start_date).getUTCFullYear().toString());
      } else {
        setStartYear('');
      }

      if (education.end_date) {
        setEndYear(new Date(education.end_date).getUTCFullYear().toString());
      } else {
        setEndYear('');
      }
    } else if (isOpen) {
      // Reset form for new education
      setSchoolName('');
      setDegree('');
      setFieldOfStudy('');
      setStartYear('');
      setEndYear('');
      setDescription('');
    }
  }, [isOpen, education]);

  const handleSave = () => {
    if (!schoolName || !startYear || !endYear) {
      alert('Please fill in all required fields.');
      return;
    }

    const educationData = {
      school_name: schoolName,
      degree,
      field_of_study: fieldOfStudy,
      description,
      start_date: new Date(Date.UTC(parseInt(startYear), 0, 1)).toISOString(),
      end_date: new Date(Date.UTC(parseInt(endYear), 0, 1)).toISOString(),
      school_logo: education?.school_logo || '', // Preserve existing logo
    };
    onSave(educationData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>{education ? 'Edit Education' : 'Add Education'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School*</Label>
            <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Ex: Boston University" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="degree">Degree</Label>
            <Input id="degree" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="Ex: BA, BS, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">Field of study</Label>
            <Input id="fieldOfStudy" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="Ex: Business" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End date (or expected)</Label>
              <Select value={endYear} onValueChange={setEndYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Activities and societies</Label>
            <textarea id="description" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Describe activities, societies, etc." className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-transparent" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function UpdateAlumniPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState<Alumni>({
    id: '',
    name: '',
    role: '',
    companies: [] as string[],
    location: '',
    family_branch: '',
    graduation_year: undefined,
    big_brother: '',
    little_brothers: [] as string[],
    linkedin_url: '',
    picture_url: '',
    bio: '',
    emails: [] as string[],
    phones: [] as string[],
    majors: [] as string[],
    minors: [] as string[],
    career_history: [] as any[],
    education: [] as any[],
    has_linkedin: false,
    scraped: false,
    manually_verified: false,
    has_enrichment: false,
    source_sheet: [] as string[],
  });
  const [bigBrotherError, setBigBrotherError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlumniData, setNewAlumniData] = useState<Partial<Alumni>>({
    name: '',
    role: '',
    companies: [] as string[],
    location: '',
    family_branch: '',
    graduation_year: undefined,
    big_brother: '',
    little_brothers: [] as string[],
    linkedin_url: '',
    picture_url: '',
    bio: '',
    emails: [] as string[],
    phones: [] as string[],
    majors: [] as string[],
    minors: [] as string[],
    career_history: [] as any[],
    education: [] as any[],
    has_linkedin: false,
    scraped: false,
    manually_verified: false,
    has_enrichment: false,
    source_sheet: [] as string[],
  });
  const [bigBrotherName, setBigBrotherName] = useState<string>('');
  const [allAlumni, setAllAlumni] = useState<Array<{ id: string; name: string }>>([]);

  // Experience form state
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any | null>(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);

  // Education form state
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any | null>(null);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);

  // Fetch all alumni names for lookup
  useEffect(() => {
    const fetchAllAlumni = async () => {
      const { data, error } = await supabase
        .from('alumni')
        .select('id, name');
      
      if (!error && data) {
        setAllAlumni(data);
      }
    };
    fetchAllAlumni();
  }, []);

  // Get name from ID
  const getNameFromId = (id: string | null) => {
    if (!id) return '';
    const alum = allAlumni.find(a => a.id === id);
    return alum?.name || '';
  };

  // Get ID from name
  const getIdFromName = (name: string) => {
    const alum = allAlumni.find(a => a.name.toLowerCase() === name.toLowerCase());
    return alum?.id || null;
  };

  const validateSearchQuery = (query: string) => {
    if (!query.trim()) {
      setSearchError('Please enter a name to search');
      return false;
    }
    if (!query.includes(' ')) {
      setSearchError('Please enter the full name (first and last name)');
      return false;
    }
    setSearchError(null);
    return true;
  };

  const handleSearch = async () => {
    if (!validateSearchQuery(searchQuery)) return;

    setLoading(true);
    setAlumni(null);
    setUpdateSuccess(false);
    setIsCreating(false);
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .single();

      if (error) throw error;
      if (data) {
        setAlumni(data);

        // --- Start of new logic ---
        const educationHistory = [...(data.education || [])];
        const majors = data.majors || [];
        const minors = data.minors || [];
        
        if (majors.length > 0 || minors.length > 0) {
          const ucsbIndex = educationHistory.findIndex(
            (edu) => edu.school_name?.toLowerCase() === 'university of california, santa barbara'
          );

          const fieldsFromArrays = [...majors, ...minors];

          if (ucsbIndex > -1) {
            // UCSB entry exists, update it by merging fields
            const ucsbEdu = { ...educationHistory[ucsbIndex] };
            
            // Combine and deduplicate fields
            const existingFields = ucsbEdu.field_of_study?.split(/[,;]/).map((f: string) => f.trim()).filter(Boolean) || [];
            const allFields = [...new Set([...existingFields, ...fieldsFromArrays])];

            ucsbEdu.field_of_study = allFields.join(', ');
            educationHistory[ucsbIndex] = ucsbEdu;

          } else {
            // No UCSB entry, create one
            educationHistory.push({
              school_name: 'University of California, Santa Barbara',
              degree: '', // Can't assume degree
              field_of_study: fieldsFromArrays.join(', '),
              start_date: null, // No assumed start/end date
              end_date: null,
              description: 'Primary undergraduate institution.',
            });
          }
        }
        // --- End of new logic ---

        setFormData({
          ...data,
          // Use the modified education history
          education: educationHistory, 
          companies: (data.companies || []).join(', '),
          little_brothers: (data.little_brothers || []).join(', '),
          emails: (data.emails || []).join(', '),
          phones: (data.phones || []).join(', '),
          // Keep majors/minors as strings for now in case user wants to edit
          majors: (data.majors || []).join(', '),
          minors: (data.minors || []).join(', '),
          source_sheet: (data.source_sheet || []).join(', '),
        });
        
        // Set the big brother name for display
        setBigBrotherName(getNameFromId(data.big_brother ?? null));
      } else {
        setSearchError('No alumni found with that name');
      }
    } catch (error) {
      console.error('Error searching for alumni:', error);
      setSearchError('Alumni not found (check for typos)');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const validateBigBrother = async (name: string) => {
    if (!name) {
      setBigBrotherError(null);
      return true;
    }
    
    const { data, error } = await supabase
      .from('alumni')
      .select('id, name')
      .ilike('name', name)
      .single();

    if (error || !data) {
      setBigBrotherError('Big brother name not found in alumni database');
      return false;
    }
    
    setBigBrotherError(null);
    return true;
  };

  const validateName = async (name: string) => {
    // If the name is empty, it means the user hasn't entered anything yet
    // or is clearing the field, so we don't show an error
    if (!name.trim()) {
      setNameError(null);
      return true;
    }

    if (!name.includes(' ')) {
      setNameError('Please enter the full name (first and last name)');
      return false;
    }

    // If the name hasn't changed, it's valid
    if (alumni && name.toLowerCase() === alumni.name.toLowerCase()) {
      setNameError(null);
      return true;
    }

    // Check if the new name already exists
    const { data, error } = await supabase
      .from('alumni')
      .select('name')
      .ilike('name', name)
      .maybeSingle();

    if (data) {
      setNameError('An alumnus with this name already exists');
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleInputChange = async (field: keyof Alumni, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));

    if (field === 'big_brother') {
      await validateBigBrother(value as string);
    } else if (field === 'name') {
      await validateName(value as string);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumni) return;

    // Only validate name if it's being changed
    if (formData.name && formData.name.trim()) {
      const isNameValid = await validateName(formData.name);
      if (!isNameValid) return;
    }
    if (bigBrotherName) {
      const isBigBrotherValid = await validateBigBrother(bigBrotherName);
      if (!isBigBrotherValid) return;
    }

    setLoading(true);
    try {
      // Convert big brother name to ID
      const bigBrotherId = getIdFromName(bigBrotherName);

      // Helper function to convert string to array for array fields
      const convertToArray = (value: any): string[] => {
        if (typeof value === 'string') {
          return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        return value || [];
      };

      // Create update object with only changed fields and required fields
      const updateData = {
        ...formData,
        name: formData.name || alumni.name,
        role: formData.role || alumni.role,
        companies: convertToArray(formData.companies),
        family_branch: formData.family_branch || alumni.family_branch,
        graduation_year: formData.graduation_year || alumni.graduation_year,
        location: formData.location || alumni.location,
        big_brother: bigBrotherId || null,
        little_brothers: convertToArray(formData.little_brothers),
        linkedin_url: formData.linkedin_url || alumni.linkedin_url,
        picture_url: formData.picture_url || alumni.picture_url,
        bio: formData.bio || alumni.bio,
        emails: convertToArray(formData.emails),
        phones: convertToArray(formData.phones),
        career_history: formData.career_history || alumni.career_history,
        education: formData.education || alumni.education,
        source_sheet: convertToArray(formData.source_sheet),
        has_linkedin: formData.has_linkedin !== undefined ? formData.has_linkedin : alumni.has_linkedin,
        scraped: formData.scraped !== undefined ? formData.scraped : alumni.scraped,
        manually_verified: formData.manually_verified !== undefined ? formData.manually_verified : alumni.manually_verified,
        has_enrichment: formData.has_enrichment !== undefined ? formData.has_enrichment : alumni.has_enrichment,
      };

      const { error } = await supabase
        .from('alumni')
        .update(updateData)
        .eq('id', alumni.id);

      if (error) throw error;
      setUpdateSuccess(true);
      toast({
        title: "Success!",
        description: "Alumni information updated successfully.",
        className: "bg-green-50 border-green-200",
      });
      // Refresh the alumni data
      const { data } = await supabase
        .from('alumni')
        .select('*')
        .eq('id', alumni.id)
        .single();
      if (data) {
        setAlumni(data);
        setFormData({
            ...data,
            companies: (data.companies || []).join(', '),
            little_brothers: (data.little_brothers || []).join(', '),
            emails: (data.emails || []).join(', '),
            phones: (data.phones || []).join(', '),
            majors: (data.majors || []).join(', '),
            minors: (data.minors || []).join(', '),
            source_sheet: (data.source_sheet || []).join(', '),
        });
        setBigBrotherName(getNameFromId(data.big_brother ?? null));
      }
    } catch (error) {
      console.error('Error updating alumni:', error);
      toast({
        title: "Error",
        description: "Failed to update alumni information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!alumni) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('alumni')
        .delete()
        .eq('id', alumni.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Alumni record deleted successfully.",
        className: "bg-green-50 border-green-200",
      });

      // Reset the form
      setAlumni(null);
      setFormData({
        id: '',
        name: '',
        role: '',
        companies: [] as string[],
        location: '',
        family_branch: '',
        graduation_year: undefined,
        big_brother: '',
        little_brothers: [] as string[],
        linkedin_url: '',
        picture_url: '',
        bio: '',
        emails: [] as string[],
        phones: [] as string[],
        majors: [] as string[],
        minors: [] as string[],
        career_history: [] as any[],
        education: [] as any[],
        has_linkedin: false,
        scraped: false,
        manually_verified: false,
        has_enrichment: false,
        source_sheet: [] as string[],
      });
      setSearchQuery('');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting alumni:', error);
      toast({
        title: "Error",
        description: "Failed to delete alumni record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAlumniData.name) {
      toast({
        title: "Error",
        description: "Name is required to create a new alumni record.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Include all required fields and initialize arrays properly
      const createData = {
        name: newAlumniData.name,
        role: newAlumniData.role || '',
        companies: newAlumniData.companies || [] as string[],
        location: newAlumniData.location || '',
        family_branch: newAlumniData.family_branch || '',
        graduation_year: newAlumniData.graduation_year,
        big_brother: newAlumniData.big_brother || '',
        little_brothers: newAlumniData.little_brothers || [] as string[],
        linkedin_url: newAlumniData.linkedin_url || '',
        picture_url: newAlumniData.picture_url || '',
        bio: newAlumniData.bio || '',
        emails: newAlumniData.emails || [] as string[],
        phones: newAlumniData.phones || [] as string[],
        majors: newAlumniData.majors || [] as string[],
        minors: newAlumniData.minors || [] as string[],
        career_history: newAlumniData.career_history || [] as any[],
        education: newAlumniData.education || [] as any[],
        source_sheet: newAlumniData.source_sheet || [] as string[],
        has_linkedin: newAlumniData.has_linkedin || false,
        scraped: newAlumniData.scraped || false,
        manually_verified: newAlumniData.manually_verified || false,
        has_enrichment: newAlumniData.has_enrichment || false,
      };

      // Better console logging
      console.log('Creating new alumni record:', JSON.stringify(createData, null, 2));

      const { data, error } = await supabase
        .from('alumni')
        .insert([createData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      toast({
        title: "Success!",
        description: "New alumni record created successfully.",
        className: "bg-green-50 border-green-200",
      });

      // Reset the form and show the new record
      setAlumni(data);
      setFormData(data);
      setIsCreating(false);
      setNewAlumniData({
        name: '',
        role: '',
        companies: [] as string[],
        location: '',
        family_branch: '',
        graduation_year: undefined,
        big_brother: '',
        little_brothers: [] as string[],
        linkedin_url: '',
        picture_url: '',
        bio: '',
        emails: [] as string[],
        phones: [] as string[],
        majors: [] as string[],
        minors: [] as string[],
        career_history: [] as any[],
        education: [] as any[],
        has_linkedin: false,
        scraped: false,
        manually_verified: false,
        has_enrichment: false,
        source_sheet: [] as string[],
      });
    } catch (error) {
      console.error('Error creating alumni:', error);
      toast({
        title: "Error",
        description: "Failed to create new alumni record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperience = () => {
    setEditingExperience(null);
    setEditingExperienceIndex(null);
    setIsExperienceModalOpen(true);
  };

  const handleEditExperience = (index: number) => {
    setEditingExperience(formData.career_history[index]);
    setEditingExperienceIndex(index);
    setIsExperienceModalOpen(true);
  };

  const handleDeleteExperience = (index: number) => {
    const updatedHistory = [...formData.career_history];
    updatedHistory.splice(index, 1);
    updateRoleAndCompaniesFromHistory(updatedHistory);
  };

  const handleSaveExperience = (experienceData: any) => {
    const updatedHistory = [...(formData.career_history || [])];
    if (editingExperienceIndex !== null) {
      // Editing existing
      updatedHistory[editingExperienceIndex] = experienceData;
    } else {
      // Adding new
      updatedHistory.unshift(experienceData); // Add to beginning for better UX
    }
    updateRoleAndCompaniesFromHistory(updatedHistory);
    setIsExperienceModalOpen(false);
  };

  const updateRoleAndCompaniesFromHistory = (history: any[]) => {
    if (!history) return;

    const getMostRecentExperience = (h: any[]) => {
      if (!h || h.length === 0) return null;

      const presentJobs = h.filter(exp => exp.end_date === 'Present');
      if (presentJobs.length > 0) {
          presentJobs.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateB - dateA;
          });
          return presentJobs[0];
      }

      const sortedHistory = [...h].sort((a, b) => {
          if (!a.end_date || !b.end_date) return 0;
          return new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
      });
      return sortedHistory.length > 0 ? sortedHistory[0] : null;
    }

    const latestExperience = getMostRecentExperience(history);
    const latestRole = latestExperience ? latestExperience.title : '';
    const allCompanies = history.length > 0 ? [...new Set(history.map(exp => exp.company_name).filter(Boolean))] : [];
    
    setFormData((prev: any) => ({
        ...prev,
        career_history: history,
        role: latestRole,
        companies: allCompanies.join(', ')
    }));
  }

  const handleAddEducation = () => {
    setEditingEducation(null);
    setEditingEducationIndex(null);
    setIsEducationModalOpen(true);
  };

  const handleEditEducation = (index: number) => {
    setEditingEducation(formData.education[index]);
    setEditingEducationIndex(index);
    setIsEducationModalOpen(true);
  };

  const handleDeleteEducation = (index: number) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    handleInputChange('education', updatedEducation);
  };

  const handleSaveEducation = (educationData: any) => {
    const updatedEducation = [...(formData.education || [])];
    if (editingEducationIndex !== null) {
      // Editing existing
      updatedEducation[editingEducationIndex] = educationData;
    } else {
      // Adding new
      updatedEducation.push(educationData);
    }
    handleInputChange('education', updatedEducation);
    setIsEducationModalOpen(false);
  };

  return (
    <main className="container mx-auto py-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8">Update Alumni Information</h1>
      
      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Alumni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Enter full name (first and last name)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError(null);
                }}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            {searchError && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">{searchError}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(true);
                    setNewAlumniData({
                      name: searchQuery,
                      role: '',
                      companies: [] as string[],
                      location: '',
                      family_branch: '',
                      graduation_year: undefined,
                      big_brother: '',
                      little_brothers: [] as string[],
                      linkedin_url: '',
                      picture_url: '',
                      bio: '',
                      emails: [] as string[],
                      phones: [] as string[],
                      majors: [] as string[],
                      minors: [] as string[],
                      career_history: [] as any[],
                      education: [] as any[],
                      has_linkedin: false,
                      scraped: false,
                      manually_verified: false,
                      has_enrichment: false,
                      source_sheet: [] as string[],
                    });
                  }}
                >
                  Create New Alumni Record
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Alumni Form */}
      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Alumni Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
              <div>
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newAlumniData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlumniData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-role">Role</Label>
                  <Input
                    id="new-role"
                    value={newAlumniData.role || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlumniData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Ex. Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="new-location">Location</Label>
                  <Input
                    id="new-location"
                    value={newAlumniData.location || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlumniData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex. San Francisco, CA"
                  />
                </div>
                <div>
                  <Label htmlFor="new-linkedin">LinkedIn URL</Label>
                  <Input
                    id="new-linkedin"
                    value={newAlumniData.linkedin_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlumniData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="Ex. https://linkedin.com/in/johnsmith"
                  />
                </div>
                <div>
                  <Label htmlFor="new-family-branch">Family Branch</Label>
                  <Input
                    id="new-family-branch"
                    value={newAlumniData.family_branch || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlumniData(prev => ({ ...prev, family_branch: e.target.value }))}
                    placeholder="Ex. Paahana"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewAlumniData({
                      name: '',
                      role: '',
                      companies: [] as string[],
                      location: '',
                      family_branch: '',
                      graduation_year: undefined,
                      big_brother: '',
                      little_brothers: [] as string[],
                      linkedin_url: '',
                      picture_url: '',
                      bio: '',
                      emails: [] as string[],
                      phones: [] as string[],
                      majors: [] as string[],
                      minors: [] as string[],
                      career_history: [] as any[],
                      education: [] as any[],
                      has_linkedin: false,
                      scraped: false,
                      manually_verified: false,
                      has_enrichment: false,
                      source_sheet: [] as string[],
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Update Form */}
      {alumni && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Update Alumni Information</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Record
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.name}</p>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex. John Smith"
                    />
                    {nameError && (
                      <p className="text-sm text-red-500">{nameError}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.location || 'Not set'}</p>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Ex. San Francisco, CA"
                    />
                  </div>
                </div>

                {/* Family Branch */}
                <div className="space-y-2">
                  <Label htmlFor="family_branch">Family Branch</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.family_branch || 'Not set'}</p>
                    <Input
                      id="family_branch"
                      value={formData.family_branch}
                      onChange={(e) => handleInputChange('family_branch', e.target.value)}
                      placeholder="Ex. Paahana"
                    />
                  </div>
                </div>

                {/* Graduation Year */}
                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.graduation_year || 'Not set'}</p>
                    <Input
                      id="graduation_year"
                      type="number"
                      value={formData.graduation_year || ''}
                      onChange={(e) => handleInputChange('graduation_year', parseInt(e.target.value))}
                      placeholder="Ex. 2007"
                      min="2000"
                      max="2025"
                    />
                  </div>
                </div>

                {/* Big Brother */}
                <div className="space-y-2">
                  <Label htmlFor="big_brother">Big Brother</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {getNameFromId(alumni.big_brother ?? null) || 'Not set'}</p>
                    <Input
                      id="big_brother"
                      value={bigBrotherName}
                      onChange={(e) => {
                        setBigBrotherName(e.target.value);
                        handleInputChange('big_brother', e.target.value);
                      }}
                      placeholder="Ex. John Smith"
                    />
                    {bigBrotherError && (
                      <p className="text-sm text-red-500">{bigBrotherError}</p>
                    )}
                  </div>
                </div>

                {/* Little Brothers */}
                <div className="space-y-2">
                  <Label htmlFor="little_brothers">Little Brothers</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.little_brothers?.join(', ') || 'Not set'}</p>
                    <Input
                      id="little_brothers"
                      value={formData.little_brothers || ''}
                      onChange={(e) => handleInputChange('little_brothers', e.target.value)}
                      placeholder="Ex. Jane Doe, Bob Smith"
                    />
                  </div>
                </div>

                {/* LinkedIn URL */}
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.linkedin_url || 'Not set'}</p>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      placeholder="Ex. https://linkedin.com/in/johnsmith"
                    />
                  </div>
                </div>

                {/* Picture URL */}
                <div className="space-y-2">
                  <Label htmlFor="picture_url">Profile Picture URL</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.picture_url || 'Not set'}</p>
                    <Input
                      id="picture_url"
                      value={formData.picture_url || ''}
                      onChange={(e) => handleInputChange('picture_url', e.target.value)}
                      placeholder="Ex. https://example.com/photo.jpg"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.bio || 'Not set'}</p>
                    <textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                      placeholder="Ex. Software engineer with 5 years of experience..."
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-transparent"
                    />
                  </div>
                </div>

                {/* Emails */}
                <div className="space-y-2">
                  <Label htmlFor="emails">Email Addresses</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.emails?.join(', ') || 'Not set'}</p>
                    <Input
                      id="emails"
                      value={formData.emails || ''}
                      onChange={(e) => handleInputChange('emails', e.target.value)}
                      placeholder="Ex. john@example.com, john.smith@gmail.com"
                    />
                  </div>
                </div>

                {/* Phones */}
                <div className="space-y-2">
                  <Label htmlFor="phones">Phone Numbers</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.phones?.join(', ') || 'Not set'}</p>
                    <Input
                      id="phones"
                      value={formData.phones || ''}
                      onChange={(e) => handleInputChange('phones', e.target.value)}
                      placeholder="Ex. (555) 123-4567, +1-555-123-4567"
                    />
                  </div>
                </div>

                {/* Career History */}
                <div className="col-span-2 space-y-2">
                  <Label>Career History</Label>
                  <div className="rounded-md border p-4 space-y-4">
                    {formData.career_history && formData.career_history.length > 0 ? (
                      formData.career_history.map((exp: any, index: number) => (
                        <div key={index} className="flex items-start justify-between border-b pb-4 last:border-b-0">
                          <div className="flex-1 pr-4">
                            <h4 className="font-semibold">{exp.title}</h4>
                            <p className="text-sm">{exp.company_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                            </p>
                            {exp.location && (
                              <p className="text-sm text-muted-foreground">{exp.location}</p>
                            )}
                            {exp.description && (
                              <p className="mt-2 text-sm whitespace-pre-wrap">{exp.description}</p>
                            )}
                          </div>
                          <div className="flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditExperience(index)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExperience(index)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No career history on file.</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddExperience}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </div>
                
                {/* Education */}
                <div className="col-span-2 space-y-2">
                  <Label>Education</Label>
                  <div className="rounded-md border p-4 space-y-4">
                    {formData.education && formData.education.length > 0 ? (
                      formData.education.map((edu: any, index: number) => (
                        <div key={index} className="flex items-start justify-between border-b pb-4 last:border-b-0">
                          <div className="flex-1 pr-4">
                            <h4 className="font-semibold">{edu.school_name}</h4>
                            <p className="text-sm">{[edu.degree, edu.field_of_study].filter(Boolean).join(', ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatEducationDate(edu.start_date)} – {formatEducationDate(edu.end_date)}
                            </p>
                            {edu.description && (
                              <p className="mt-2 text-sm whitespace-pre-wrap">{edu.description}</p>
                            )}
                          </div>
                          <div className="flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditEducation(index)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEducation(index)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No education history on file.</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddEducation}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </div>

                {/* Boolean Flags */}
                <div className="space-y-4 col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manually_verified"
                        checked={formData.manually_verified || false}
                        onCheckedChange={(checked) => handleInputChange('manually_verified', checked)}
                      />
                      <Label htmlFor="manually_verified" className="text-sm">Manually Verified</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                     if (!alumni) return;
                     setFormData({
                       ...alumni,
                       companies: (alumni.companies || []).join(', '),
                       little_brothers: (alumni.little_brothers || []).join(', '),
                       emails: (alumni.emails || []).join(', '),
                       phones: (alumni.phones || []).join(', '),
                       majors: (alumni.majors || []).join(', '),
                       minors: (alumni.minors || []).join(', '),
                       source_sheet: (alumni.source_sheet || []).join(', '),
                     });
                     setBigBrotherName(getNameFromId(alumni.big_brother ?? null));
                     setUpdateSuccess(false);
                     setBigBrotherError(null);
                     setNameError(null);
                  }}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={loading || !!bigBrotherError || !!nameError}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Information'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Experience Form Dialog */}
      <ExperienceForm 
        isOpen={isExperienceModalOpen}
        onClose={() => setIsExperienceModalOpen(false)}
        onSave={handleSaveExperience}
        experience={editingExperience}
      />

      {/* Education Form Dialog */}
      <EducationForm
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        onSave={handleSaveEducation}
        education={editingEducation}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the alumni record
              for {alumni?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
} 