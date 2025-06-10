'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select2';
import { useToast } from '@/components/ui/use-toast';
import { Search } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  big_brother: string | null;
  little_brothers: string[];
  family_branch: string;
}

const FAMILY_BRANCHES = [
  'Paahana', 'Magpantay', 'Brecek', 'Brugos', 'Cauntay', 
  'Johnson', 'Chou', 'Heller', 'Li'
] as const;

type FamilyBranch = typeof FAMILY_BRANCHES[number];

export default function FamilyTreeAdmin() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilyBranch>(FAMILY_BRANCHES[0]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [bigBrother, setBigBrother] = useState<string>('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]);
  const [searchingUnassigned, setSearchingUnassigned] = useState(false);

  useEffect(() => {
    fetchFamilyData();
  }, [selectedFamily]);

  const fetchFamilyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .eq('family_branch', selectedFamily);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch family data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedFamily, toast]);

  const searchUnassignedMembers = useCallback(async () => {
    if (!unassignedSearch.trim()) return;
    
    setSearchingUnassigned(true);
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .is('family_branch', null)
        .ilike('name', `%${unassignedSearch}%`)
        .limit(10);

      if (error) throw error;
      setUnassignedMembers(data || []);
    } catch (error) {
      console.error('Error searching unassigned members:', error);
      toast({
        title: 'Error',
        description: 'Failed to search unassigned members',
        variant: 'destructive',
      });
    } finally {
      setSearchingUnassigned(false);
    }
  }, [unassignedSearch, toast]);

  const addToFamily = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('alumni')
        .update({ family_branch: selectedFamily })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member added to family successfully',
      });

      const { data: updatedMembers } = await supabase
        .from('alumni')
        .select('*')
        .eq('family_branch', selectedFamily);
      
      setMembers(updatedMembers || []);

      if (unassignedSearch.trim()) {
        const { data: updatedUnassigned } = await supabase
          .from('alumni')
          .select('*')
          .is('family_branch', null)
          .ilike('name', `%${unassignedSearch}%`)
          .limit(10);
        
        setUnassignedMembers(updatedUnassigned || []);
      }
    } catch (error) {
      console.error('Error adding member to family:', error);
      toast({
        title: 'Error',
        description: 'Failed to add member to family',
        variant: 'destructive',
      });
    }
  }, [selectedFamily, unassignedSearch, toast]);

  const handleUpdateBigBrother = async () => {
    if (!selectedMember || !bigBrother) return;

    try {
      // First, find the big brother's ID
      const bigBrotherMember = members.find(m => m.name === bigBrother);
      if (!bigBrotherMember) {
        toast({
          title: 'Error',
          description: 'Big brother not found in family',
          variant: 'destructive',
        });
        return;
      }

      // Update the selected member's big brother to the big brother's ID
      const { error } = await supabase
        .from('alumni')
        .update({ big_brother: bigBrotherMember.id })
        .eq('id', selectedMember.id);

      if (error) throw error;

      // Update the big brother's little brothers array
      const { error: updateError } = await supabase
        .from('alumni')
        .update({
          little_brothers: [...(bigBrotherMember.little_brothers || []), selectedMember.id]
        })
        .eq('id', bigBrotherMember.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Family relationship updated successfully',
      });

      fetchFamilyData();
      setSelectedMember(null);
      setBigBrother('');
    } catch (error) {
      console.error('Error updating family relationship:', error);
      toast({
        title: 'Error',
        description: 'Failed to update family relationship',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Family Tree Management</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Label>Select Family</Label>
          <Select value={selectedFamily} onValueChange={(value) => setSelectedFamily(value as FamilyBranch)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Choose a family" />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_BRANCHES.map((family) => (
                <SelectItem key={family} value={family}>
                  {family} Family
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Family Members</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedMember?.id === member.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">
                      Big Brother: {member.big_brother ? members.find(m => m.id === member.big_brother)?.name || 'Unknown' : 'None'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Family Relationship</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMember ? (
              <div className="space-y-4">
                <div>
                  <Label>Selected Member</Label>
                  <div className="font-medium">{selectedMember.name}</div>
                </div>
                <div>
                  <Label>Current Big Brother</Label>
                  <div className="text-gray-500">
                    {selectedMember.big_brother
                      ? members.find(m => m.id === selectedMember.big_brother)?.name || 'Unknown'
                      : 'None'}
                  </div>
                </div>
                <div>
                  <Label>Set New Big Brother</Label>
                  <Select value={bigBrother} onValueChange={setBigBrother}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select big brother" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter(m => m.id !== selectedMember.id)
                        .map(member => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleUpdateBigBrother}
                  disabled={!bigBrother}
                  className="w-full"
                >
                  Update Relationship
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Select a member to update their family relationship
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add Unassigned Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current {selectedFamily} members: {members.map(m => m.name).sort((a, b) => a.localeCompare(b)).join(', ')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search for unassigned members..."
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnassignedMembers()}
                />
              </div>
              <Button
                onClick={searchUnassignedMembers}
                disabled={searchingUnassigned || !unassignedSearch.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {searchingUnassigned ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : unassignedMembers.length > 0 ? (
              <div className="space-y-2">
                {unassignedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">No family assigned</div>
                    </div>
                    <Button
                      onClick={() => addToFamily(member.id)}
                      variant="outline"
                      size="sm"
                    >
                      Add to {selectedFamily} Family
                    </Button>
                  </div>
                ))}
              </div>
            ) : unassignedSearch ? (
              <div className="text-center text-gray-500 py-4">
                No unassigned members found
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 