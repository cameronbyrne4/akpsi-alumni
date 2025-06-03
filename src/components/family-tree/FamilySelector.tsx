'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FamilySelectorProps {
  families: readonly string[];
  selectedFamily: string;
  onFamilyChange: (family: string) => void;
}

export function FamilySelector({
  families,
  selectedFamily,
  onFamilyChange,
}: FamilySelectorProps) {
  return (
    <div className="w-full max-w-sm">
      <Select value={selectedFamily} onValueChange={onFamilyChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a family" />
        </SelectTrigger>
        <SelectContent>
          {families.map((family) => (
            <SelectItem key={family} value={family}>
              {family}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 