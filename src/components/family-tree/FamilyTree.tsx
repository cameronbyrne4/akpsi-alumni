'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select2';
import { Card } from '@/components/ui/card2';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Member {
  id: string;
  name: string;
  big_brother?: string;
  little_brothers: string[];
  family_branch: string;
}

// Use d3.HierarchyPointNode directly since it has all the methods we need
type TreeNode = d3.HierarchyPointNode<Member>;

const FAMILY_BRANCHES = [
  'Paahana', 'Magpantay', 'Brecek', 'Brugos', 'Cauntay', 
  'Johnson', 'Chou', 'Heller', 'Li'
] as const;

type FamilyBranch = typeof FAMILY_BRANCHES[number];

export function FamilyTree() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedFamily, setSelectedFamily] = useState<FamilyBranch>(FAMILY_BRANCHES[0]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const buildHierarchy = (familyName: string): TreeNode | null => {
    const familyMembers = members.filter(member => member.family_branch === familyName);
    if (familyMembers.length === 0) return null;

    // Create a map of names to IDs for lookup
    const nameToId = new Map(familyMembers.map(member => [member.name, member.id]));

    // Find root (member with no big_brother)
    const root = familyMembers.find(member => !member.big_brother);
    if (!root) return null;

    const buildTree = (member: Member): any => {
      const children = familyMembers
        .filter(m => {
          // If big_brother is a name, look up the ID
          const bigBrotherId = nameToId.get(m.big_brother || '');
          return bigBrotherId === member.id;
        })
        .map(buildTree);
      
      return {
        ...member,
        children: children.length > 0 ? children : undefined
      };
    };

    const hierarchy = d3.hierarchy(buildTree(root));
    const tree = d3.tree<Member>().size([800, 500]);
    return tree(hierarchy);
  };

  const renderTree = () => {
    if (!svgRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const container = svg.append('g')
      .attr('class', 'tree-container');

    // Create links (connections between nodes)
    const links = treeData.links();
    
    // Custom curve generator for organic lines
    const linkGenerator = d3.linkVertical<any, TreeNode>()
      .x(d => d.x + margin.left + 200)
      .y(d => d.y + margin.top + 50);

    container.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator)
      .style('fill', 'none')
      .style('stroke', '#64748b')
      .style('stroke-width', 2)
      .style('stroke-opacity', 0.6);

    // Create nodes
    const nodes = container.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x + margin.left + 200}, ${d.y + margin.top + 50})`);

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', 25)
      .style('fill', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('stroke', '#475569')
      .style('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s ease')
      .on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 35)
          .style('filter', 'brightness(1.2)');
        
        // Dim other nodes
        nodes.selectAll('circle')
          .filter(function() { return this !== d3.select(this).node(); })
          .transition()
          .duration(200)
          .style('opacity', 0.3);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 25)
          .style('filter', 'brightness(1)');
        
        // Restore other nodes
        nodes.selectAll('circle')
          .transition()
          .duration(200)
          .style('opacity', 1);
      });

    // Add text labels
    nodes.append('text')
      .attr('dy', -35)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', '#1e293b')
      .style('pointer-events', 'none')
      .text(d => d.data.name);

    // Center the tree
    const bounds = container.node()?.getBBox();
    if (bounds) {
      const centerX = width / 2 - bounds.x - bounds.width / 2;
      const centerY = height / 2 - bounds.y - bounds.height / 2;
      container.attr('transform', `translate(${centerX}, ${centerY})`);
    }
  };

  useEffect(() => {
    const fetchFamilyData = async () => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [selectedFamily]);

  useEffect(() => {
    const hierarchy = buildHierarchy(selectedFamily);
    setTreeData(hierarchy);
  }, [selectedFamily, members]);

  useEffect(() => {
    if (treeData) {
      renderTree();
    }
  }, [treeData]);

  const handleFamilyChange = (family: string) => {
    setSelectedFamily(family as FamilyBranch);
  };

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3]);
      svg.transition()
        .duration(300)
        .call(zoomBehavior.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3]);
      svg.transition()
        .duration(300)
        .call(zoomBehavior.scaleBy, 1 / 1.5);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6" style={{
      backgroundImage: `radial-gradient(#e2e8f0 2px, transparent 2px)`,
      backgroundSize: '40px 40px'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Tree Visualization */}
        <div className="relative overflow-hidden rounded-lg">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="600"
              viewBox="0 0 1000 600"
            />
          )}
          
          {/* Controls */}
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            {/* Family Selector */}
            <div className="shadow-lg">
              <Select value={selectedFamily} onValueChange={handleFamilyChange}>
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

          {/* Navigation instructions */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-600">
            <div className="font-medium mb-1">Navigation:</div>
            <div>• Mouse wheel: Zoom in/out</div>
            <div>• Click & drag: Pan around</div>
            <div>• Hover nodes: See details</div>
          </div>
        </div>
      </div>
    </div>
  );
} 