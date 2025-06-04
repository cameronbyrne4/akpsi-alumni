'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card2';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlumniProfileDialog } from '@/components/ui/alumni-profile-dialog';

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
  role?: string;
  companies?: string[];
  bio?: string;
  graduation_year?: number;
  location?: string;
  linkedin_url?: string;
  email?: string;
  phone?: string;
  major?: string;
  minor?: string;
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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedNode, setSelectedNode] = useState<Member | null>(null);

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

    // Initialize zoom behavior if not already done
    if (!zoomRef.current) {
      zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
        });
      svg.call(zoomRef.current);
    }

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
      .style('stroke-opacity', selectedNode ? 0.3 : 0.6)
      .style('transition', 'stroke-opacity 0.3s ease');

    // Create nodes
    const nodes = container.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x + margin.left + 200}, ${d.y + margin.top + 50})`)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data);
      });

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', d => selectedNode?.id === d.data.id ? 30 : 25)
      .style('fill', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('stroke', '#475569')
      .style('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s ease')
      .style('filter', d => selectedNode?.id === d.data.id ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none')
      .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1);

    // Add text labels
    nodes.append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '12px')
      .style('font-weight', d => selectedNode?.id === d.data.id ? '700' : '500')
      .style('fill', '#1e293b')
      .style('pointer-events', 'none')
      .style('transition', 'all 0.3s ease')
      .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1)
      .text(d => d.data.name);

    // Only center the tree on initial render or family change
    if (!selectedNode) {
      const bounds = container.node()?.getBBox();
      if (bounds && zoomRef.current) {
        const centerX = width / 2 - bounds.x - bounds.width / 2;
        const centerY = height / 2 - bounds.y - bounds.height / 2;
        
        svg.transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity.translate(centerX, centerY));
      }
    }
  };

  useEffect(() => {
    const fetchFamilyData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('alumni')
          .select(`
            id, 
            name, 
            big_brother, 
            little_brothers, 
            family_branch,
            role,
            companies,
            bio,
            graduation_year,
            location,
            linkedin_url,
            email,
            phone,
            major,
            minor
          `)
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
  }, [treeData]); // Only re-render on tree data changes

  // Effect for handling selection changes
  useEffect(() => {
    if (treeData && svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('.tree-container');
      
      // Update styles without re-rendering the entire tree
      container.selectAll('.link')
        .style('stroke-opacity', selectedNode ? 0.3 : 0.6);

      container.selectAll<SVGGElement, TreeNode>('.node circle')
        .attr('r', d => selectedNode?.id === d.data.id ? 30 : 25)
        .style('filter', d => selectedNode?.id === d.data.id ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none')
        .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1);

      container.selectAll<SVGTextElement, TreeNode>('.node text')
        .style('font-weight', d => selectedNode?.id === d.data.id ? '700' : '500')
        .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1);
    }
  }, [selectedNode, treeData]);

  const handleFamilyChange = (family: string) => {
    setSelectedFamily(family as FamilyBranch);
  };

  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1 / 1.5);
    }
  };

  const handleReset = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6" style={{
      backgroundImage: `radial-gradient(#e2e8f0 2px, transparent 2px)`,
      backgroundSize: '40px 40px'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Tree Visualization */}
        <div className="relative overflow-hidden rounded-lg" onClick={() => setSelectedNode(null)}>
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
              className="cursor-move"
            />
          )}
          
          {/* Controls */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-4">
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

            {/* Zoom Controls */}
            <div className="flex gap-2">
              <Button onClick={handleZoomIn} variant="outline" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </Button>
              <Button onClick={handleZoomOut} variant="outline" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              </Button>
            </div>
          </div>

          {/* Navigation instructions */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-600 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="font-medium mb-1">Navigation:</div>
            <div>• Mouse wheel: Zoom in/out</div>
            <div>• Click & drag: Pan around</div>
            <div>• Click nodes: See details</div>
          </div>

          {/* Member Details Card */}
          {selectedNode && (
            <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
              <div className="fixed bottom-4 right-4 z-50">
                <AlumniProfileDialog
                  name={selectedNode.name}
                  role={selectedNode.role}
                  companies={selectedNode.companies}
                  bio={selectedNode.bio}
                  familyBranch={selectedNode.family_branch}
                  graduationYear={selectedNode.graduation_year}
                  location={selectedNode.location}
                  bigBrother={selectedNode.big_brother}
                  littleBrothers={selectedNode.little_brothers}
                  linkedinUrl={selectedNode.linkedin_url}
                  email={selectedNode.email}
                  phone={selectedNode.phone}
                  major={selectedNode.major}
                  minor={selectedNode.minor}
                />
              </div>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
} 