"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alumni } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';
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

export default function UpdateAlumniPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<Alumni>>({});
  const [bigBrotherError, setBigBrotherError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlumniData, setNewAlumniData] = useState<Partial<Alumni>>({
    name: '',
    role: '',
    companies: [] as string[],
    industry: [] as string[],
    location: '',
    family_branch: '',
    graduation_year: undefined,
    big_brother: '',
    little_brothers: [] as string[],
  });
  const [bigBrotherName, setBigBrotherName] = useState<string>('');
  const [allAlumni, setAllAlumni] = useState<Array<{ id: string; name: string }>>([]);

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
        setFormData({
          id: data.id,
          name: '',
          role: '',
          companies: [],
          industry: [] as string[],
          location: '',
          family_branch: '',
          graduation_year: undefined,
          big_brother: '',
          little_brothers: [],
        });
        // Set the big brother name for display
        setBigBrotherName(getNameFromId(data.big_brother));
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

  const handleInputChange = async (field: keyof Alumni, value: string | number | string[]) => {
    // Always update the form data first
    setFormData(prev => ({
      ...prev,
      [field]: value // Remove the || '' since we want to preserve arrays
    }));

    // Then validate if it's a field that needs validation
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

      // Create update object with only changed fields and required fields
      const updateData = {
        ...formData,
        // Ensure required fields are included
        name: formData.name || alumni.name,
        role: formData.role || alumni.role,
        companies: formData.companies || alumni.companies,
        industry: formData.industry || alumni.industry,
        family_branch: formData.family_branch || alumni.family_branch,
        graduation_year: formData.graduation_year || alumni.graduation_year,
        location: formData.location || alumni.location,
        big_brother: bigBrotherId || null,
        // Keep existing values for boolean fields
        has_linkedin: alumni.has_linkedin,
        scraped: alumni.scraped,
        manually_verified: alumni.manually_verified,
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
        setFormData(data);
        setBigBrotherName(getNameFromId(data.big_brother));
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
      setFormData({});
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
        has_linkedin: false,
        scraped: false,
        manually_verified: false,
        // Initialize all array fields as empty arrays
        companies: [] as string[],
        industry: [] as string[],
        little_brothers: [] as string[],
        source_sheet: [] as string[],
        career_history: [] as string[],
        majors: [] as string[],
        minors: [] as string[],
        emails: [] as string[],
        phones: [] as string[],
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
        industry: [] as string[],
        location: '',
        family_branch: '',
        graduation_year: undefined,
        big_brother: '',
        little_brothers: [] as string[],
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
                      industry: [] as string[],
                      location: '',
                      family_branch: '',
                      graduation_year: undefined,
                      big_brother: '',
                      little_brothers: [] as string[],
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
                  onChange={(e) => setNewAlumniData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
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
                      industry: [] as string[],
                      location: '',
                      family_branch: '',
                      graduation_year: undefined,
                      big_brother: '',
                      little_brothers: [] as string[],
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

                {/* Current Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Current Role</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.role || 'Not set'}</p>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="Ex. Software Engineer"
                    />
                  </div>
                </div>

                {/* Companies */}
                <div className="space-y-2">
                  <Label htmlFor="companies">Companies</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.companies?.join(', ') || 'Not set'}</p>
                    <Input
                      id="companies"
                      value={formData.companies?.join(', ') || ''}
                      onChange={(e) => handleInputChange('companies', e.target.value.split(',').map(c => c.trim()))}
                      placeholder="Ex. Google, Microsoft"
                    />
                  </div>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.industry?.join(', ') || 'Not set'}</p>
                    <Input
                      id="industry"
                      value={formData.industry?.join(', ') || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value.split(',').map(i => i.trim()))}
                      placeholder="Ex. Technology"
                    />
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
                    <p className="text-sm text-muted-foreground">Current: {bigBrotherName || 'Not set'}</p>
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
                      value={formData.little_brothers?.join(', ') || ''}
                      onChange={(e) => handleInputChange('little_brothers', e.target.value.split(',').map(b => b.trim()))}
                      placeholder="Ex. Jane Doe, Bob Smith"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      id: alumni.id,
                      name: '',
                      role: '',
                      companies: [],
                      industry: [],
                      location: '',
                      family_branch: '',
                      graduation_year: undefined,
                      big_brother: '',
                      little_brothers: [],
                    });
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