'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card2';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogPortal } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlumniCardContent } from '@/components/ui/alumni-card';
import { getRandomAvatar } from '@/lib/utils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Custom DialogContent without overlay
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Content
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = DialogPrimitive.Content.displayName;

interface Member {
  id: string;
  name: string;
  big_brother?: string;
  little_brothers: string[];
  family_branch: string;
  picture_url: string;
  role: string;
  companies: string[];
  bio: string;
  graduation_year: number;
  location: string;
  linkedin_url: string;
  emails: string[];
  phones: string[];
  majors: string[];
  minors: string[];
  has_enrichment: boolean;
  scraped: boolean;
  career_history: CareerExperience[];
  education: Education[];
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const buildHierarchy = (familyName: string): TreeNode | null => {
    const familyMembers = members.filter(member => member.family_branch === familyName);
    if (familyMembers.length === 0) return null;

    // Find root (member with no big_brother)
    const root = familyMembers.find(member => !member.big_brother);
    if (!root) return null;

    const buildTree = (member: Member): any => {
      const children = familyMembers
        .filter(m => m.big_brother === member.id)
        .map(buildTree);
      
      return {
        ...member,
        children: children.length > 0 ? children : undefined
      };
    };

    const hierarchy = d3.hierarchy(buildTree(root));
    const tree = d3.tree<Member>()
      .size([800, 800])
      .separation((a, b) => a.parent === b.parent ? 2 : 1.5);
    return tree(hierarchy);
  };

  const renderTree = () => {
    if (!svgRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 1000;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    // Create or select a single <defs> section
    let defs = svg.select('defs') as d3.Selection<SVGDefsElement, unknown, null, undefined>;
    if (defs.empty()) {
      defs = svg.append('defs') as d3.Selection<SVGDefsElement, unknown, null, undefined>;
      // Add the background pattern only once
      const backgroundPattern = defs.append('pattern')
        .attr('id', 'dotted-grid')
        .attr('width', 32)
        .attr('height', 32)
        .attr('patternUnits', 'userSpaceOnUse');
      backgroundPattern.append('circle')
        .attr('cx', 16)
        .attr('cy', 16)
        .attr('r', 1.5)
        .attr('fill', '#e5e7eb');
    }
    // Remove only old clipPaths before adding new ones
    defs.selectAll('clipPath').remove();
    // Create clip paths for all nodes
    treeData.descendants().forEach(d => {
      defs.append('clipPath')
        .attr('id', `clip-${d.data.id}`)
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', selectedNode?.id === d.data.id ? 30 : 25);
    });

    // Create background rectangle with pattern that will transform with zoom
    const backgroundGroup = svg.append('g')
      .attr('class', 'background-group');

    backgroundGroup.append('rect')
      .attr('x', -2000)
      .attr('y', -2000)
      .attr('width', 4000)
      .attr('height', 4000)
      .attr('fill', 'url(#dotted-grid)');

    // Create the tree container group (after background)
    const container = svg.append('g')
      .attr('class', 'tree-container');

    // Initialize zoom behavior
    zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        backgroundGroup.attr('transform', event.transform);
        container.attr('transform', event.transform);
        svg.select('pattern#dotted-grid').attr('patternTransform', event.transform);
      });

    // Apply zoom behavior to SVG
    svg.call(zoomRef.current);

    // Create links (connections between nodes)
    const links = treeData.links();
    
    // Custom curve generator for organic lines
    const linkGenerator = d3.linkVertical<any, TreeNode>()
      .x(d => d.x + margin.left)
      .y(d => d.y + margin.top);

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
      .attr('transform', d => `translate(${d.x + margin.left}, ${d.y + margin.top})`)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data);
      });

    // Add a border circle for each node (below the image)
    nodes.append('circle')
      .attr('class', 'avatar-border')
      .attr('r', d => selectedNode?.id === d.data.id ? 30 : 25)
      .attr('fill', '#fff')
      .attr('stroke', '#475569')
      .attr('stroke-width', 2)
      .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1)
      .style('transition', 'all 0.3s ease')
      .style('filter', d => selectedNode?.id === d.data.id ? 'drop-shadow(0 0 12px #3b82f6)' : 'none');

    // Add images for nodes - Apply circular clipping to ALL nodes
    nodes.append('image')
      .attr('class', 'avatar-img')
      .attr('href', d => d.data.picture_url || getRandomAvatar(d.data.name))
      .attr('width', d => selectedNode?.id === d.data.id ? 60 : 50)
      .attr('height', d => selectedNode?.id === d.data.id ? 60 : 50)
      .attr('x', d => (selectedNode?.id === d.data.id ? -30 : -25))
      .attr('y', d => (selectedNode?.id === d.data.id ? -30 : -25))
      .attr('clip-path', d => `url(#clip-${d.data.id})`)
      .style('cursor', 'pointer')
      .style('filter', d => selectedNode?.id === d.data.id ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none')
      .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1)
      .style('transition', 'all 0.3s ease')
      .on('error', function(event, d) {
        d3.select(this).attr('href', getRandomAvatar(d.data.name));
      });

    // Add a group for label background and text
    const labelGroups = nodes.append('g')
      .attr('class', 'node-label-group')
      .attr('transform', 'translate(0, 45)');

    // Add background rect
    labelGroups.append('rect')
      .attr('class', 'node-label-bg')
      .attr('x', function(d) {
        const text = d.data.name;
        const len = text.length;
        return -len * 3.5 - 8; // estimate width, center
      })
      .attr('y', -12)
      .attr('width', function(d) {
        const text = d.data.name;
        const len = text.length;
        return len * 7 + 16; // estimate width
      })
      .attr('height', 24)
      .attr('rx', 12)
      .attr('fill', '#fff')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.2)
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))')
      .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1)
      .style('transition', 'all 0.3s ease');

    // Add text on top of rect
    labelGroups.append('text')
      .attr('class', 'node-label-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', 0)
      .style('font-family', 'Inter, sans-serif')
      .style('font-size', '13px')
      .style('font-weight', d => selectedNode?.id === d.data.id ? '700' : '500')
      .style('fill', '#1e293b')
      .style('pointer-events', 'none')
      .style('transition', 'all 0.3s ease')
      .style('opacity', d => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1)
      .text(d => d.data.name);

    // Center the tree on initial render or family change
    if (!selectedNode) {
      const bounds = container.node()?.getBBox();
      if (bounds && zoomRef.current) {
        // First zoom in on root node
        const rootNode = treeData.descendants()[0];
        const initialX = width / 2 - (rootNode.x + margin.left);
        const initialY = height / 2 - (rootNode.y + margin.top) - 100;
        if (zoomRef.current) {
          // Calculate the transform to center on root node
          const transform = d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1.5)
            .translate(-(rootNode.x + margin.left), -(rootNode.y + margin.top));
          svg.transition()
            .duration(750)
            .call(zoomRef.current.transform, transform);
          // Then zoom out to show full tree after a delay
          setTimeout(() => {
            const centerX = width / 2 - bounds.x - bounds.width / 2 + 100;
            const centerY = height / 2 - bounds.y - bounds.height / 2;
            if (zoomRef.current) {
              svg.transition()
                .duration(1000)
                .call(zoomRef.current.transform, d3.zoomIdentity.translate(centerX, centerY).scale(0.65));
            }
          }, 1000);
        }
      }
    }
  };

  // Cleanup zoom behavior when component unmounts
  useEffect(() => {
    return () => {
      if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).on('.zoom', null);
      }
    };
  }, []);

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
  }, [treeData, selectedFamily]); // Add selectedFamily to dependencies

  // Effect for handling selection changes
  useEffect(() => {
    if (treeData && svgRef.current) {
      const svg = d3.select(svgRef.current);
      const container = svg.select('.tree-container');
      const defs = svg.select('defs');
      // Update styles without re-rendering the entire tree
      container.selectAll('.link')
        .style('stroke-opacity', selectedNode ? 0.3 : 0.6);
      // Update all clipPath radii based on selection
      defs.selectAll('clipPath').each(function(d: any) {
        const id = d3.select(this).attr('id');
        const nodeDatum = treeData.descendants().find(n => `clip-${n.data.id}` === id);
        d3.select(this).select('circle')
          .attr('r', nodeDatum && selectedNode?.id === nodeDatum.data.id ? 30 : 25);
      });
      // Update all border circles
      container.selectAll('circle.avatar-border')
        .attr('r', (d: any) => selectedNode?.id === d.data.id ? 30 : 25)
        .style('opacity', (d: any) => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1)
        .style('filter', (d: any) => selectedNode?.id === d.data.id ? 'drop-shadow(0 0 12px #3b82f6)' : 'none');
      // Update all images
      container.selectAll('image.avatar-img')
        .attr('width', (d: any) => selectedNode?.id === d.data.id ? 60 : 50)
        .attr('height', (d: any) => selectedNode?.id === d.data.id ? 60 : 50)
        .attr('x', (d: any) => (selectedNode?.id === d.data.id ? -30 : -25))
        .attr('y', (d: any) => (selectedNode?.id === d.data.id ? -30 : -25))
        .style('filter', (d: any) => selectedNode?.id === d.data.id ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none')
        .style('opacity', (d: any) => selectedNode && selectedNode.id !== d.data.id ? 0.3 : 1);
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
    <div
      className="min-h-screen p-6 bg-white"
    >
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
              height="1000"
              viewBox="0 0 1000 1000"
              className="cursor-move"
            />
          )}
          
          {/* Controls */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-4">
            {/* Family Selector */}
            <div className="border border-blue-500 rounded-lg transition-all duration-200 hover:border-blue-600 focus-within:border-blue-600 focus-within:shadow-[0_0_12px_2px_rgba(59,130,246,0.25)]">
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

          {/* Navigation instructions - vertically centered on left edge */}
          <div
            className="absolute text-sm text-slate-600 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-blue-500"
            style={{
              top: '50%',
              left: '2rem',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          >
            <div className="font-medium mb-1">Navigation:</div>
            <div>• Mouse wheel: Zoom in/out</div>
            <div>• Click & drag: Pan around</div>
            <div>• Click nodes: See details</div>
          </div>

          {/* Member Details Card */}
          {selectedNode && (
            <div className="fixed bottom-4 right-4 top-auto left-auto translate-x-0 translate-y-0 z-50">
              <AlumniCardContent
                name={selectedNode.name}
                pictureUrl={selectedNode.picture_url}
                role={selectedNode.role}
                companies={selectedNode.companies}
                bio={selectedNode.bio}
                familyBranch={selectedNode.family_branch}
                graduationYear={selectedNode.graduation_year}
                location={selectedNode.location}
                bigBrother={selectedNode.big_brother}
                littleBrothers={selectedNode.little_brothers}
                linkedinUrl={selectedNode.linkedin_url}
                email={selectedNode.emails}
                phone={selectedNode.phones}
                major={selectedNode.majors}
                minor={selectedNode.minors}
                members={members.map(m => ({ id: m.id, name: m.name }))}
                hasEnrichment={selectedNode.has_enrichment}
                scraped={selectedNode.scraped}
                careerHistory={selectedNode.career_history}
                education={selectedNode.education}
                showFamilyBranch={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 