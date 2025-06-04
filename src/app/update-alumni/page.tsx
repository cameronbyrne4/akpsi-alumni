"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Alumni } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

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
          industry: '',
          location: '',
          family_branch: '',
          graduation_year: undefined,
          big_brother: '',
          little_brothers: [],
        });
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
      .select('name')
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
      [field]: value || '' // Ensure we never set null/undefined values
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
    if (formData.big_brother) {
      const isBigBrotherValid = await validateBigBrother(formData.big_brother);
      if (!isBigBrotherValid) return;
    }

    setLoading(true);
    try {
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
              <p className="text-sm text-red-500">{searchError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Form */}
      {alumni && (
        <Card>
          <CardHeader>
            <CardTitle>Update Information for {alumni.name}</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Current: {alumni.industry || 'Not set'}</p>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
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
                    <p className="text-sm text-muted-foreground">Current: {alumni.big_brother || 'Not set'}</p>
                    <Input
                      id="big_brother"
                      value={formData.big_brother}
                      onChange={(e) => handleInputChange('big_brother', e.target.value)}
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
                      industry: '',
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
    </main>
  );
} 