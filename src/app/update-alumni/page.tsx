"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Alumni } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function UpdateAlumniPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<Alumni>>({});
  const [bigBrotherError, setBigBrotherError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

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
        setFormData(data);
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

  const handleInputChange = async (field: keyof Alumni, value: string | number | string[]) => {
    // Always update the form data first
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Then validate if it's the big brother field
    if (field === 'big_brother') {
      await validateBigBrother(value as string);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumni) return;

    // Validate big brother one final time before submission
    if (formData.big_brother) {
      const isValid = await validateBigBrother(formData.big_brother);
      if (!isValid) return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('alumni')
        .update(formData)
        .eq('id', alumni.id);

      if (error) throw error;
      setUpdateSuccess(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-8">
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
                {/* Current Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Current Role</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current: {alumni.role || 'Not set'}</p>
                    <Input
                      id="role"
                      value={formData.role || ''}
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
                      value={formData.industry || ''}
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
                      value={formData.location || ''}
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
                      value={formData.family_branch || ''}
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
                      value={formData.big_brother || ''}
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
                    setFormData(alumni);
                    setUpdateSuccess(false);
                    setBigBrotherError(null);
                  }}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={loading || !!bigBrotherError}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Information'}
                </Button>
              </div>

              {updateSuccess && (
                <p className="text-green-600 text-center">Information updated successfully!</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
} 