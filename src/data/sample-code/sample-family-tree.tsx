// generated with Lovable for reference


import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select2';
import { Card } from '@/components/ui/card2';

interface Member {
  id: string;
  name: string;
  big_brother?: string;
  little_brothers: string[];
  family_branch: string;
}

// Use d3.HierarchyPointNode directly since it has all the methods we need
type TreeNode = d3.HierarchyPointNode<Member>;

const FamilyTree = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedFamily, setSelectedFamily] = useState('Paahana');
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const families = [
    'Paahana', 'Magpantay', 'Brecek', 'Brugos', 'Cauntay', 
    'Johnson', 'Chou', 'Heller', 'Li'
  ];

  // Mock data - in real implementation, this would come from Supabase
  const mockData: Member[] = [
    // Paahana family
    { id: 'paahana-founder', name: 'John Paahana', family_branch: 'Paahana', little_brothers: ['paahana-2', 'paahana-3'] },
    { id: 'paahana-2', name: 'Mike Chen', big_brother: 'paahana-founder', family_branch: 'Paahana', little_brothers: ['paahana-4'] },
    { id: 'paahana-3', name: 'David Kim', big_brother: 'paahana-founder', family_branch: 'Paahana', little_brothers: ['paahana-5', 'paahana-6'] },
    { id: 'paahana-4', name: 'Alex Rodriguez', big_brother: 'paahana-2', family_branch: 'Paahana', little_brothers: [] },
    { id: 'paahana-5', name: 'James Wilson', big_brother: 'paahana-3', family_branch: 'Paahana', little_brothers: [] },
    { id: 'paahana-6', name: 'Ryan Lee', big_brother: 'paahana-3', family_branch: 'Paahana', little_brothers: [] },
    
    // Magpantay family
    { id: 'magpantay-founder', name: 'Carlos Magpantay', family_branch: 'Magpantay', little_brothers: ['magpantay-2'] },
    { id: 'magpantay-2', name: 'Anthony Garcia', big_brother: 'magpantay-founder', family_branch: 'Magpantay', little_brothers: ['magpantay-3', 'magpantay-4'] },
    { id: 'magpantay-3', name: 'Steven Park', big_brother: 'magpantay-2', family_branch: 'Magpantay', little_brothers: [] },
    { id: 'magpantay-4', name: 'Kevin Zhang', big_brother: 'magpantay-2', family_branch: 'Magpantay', little_brothers: [] },

    // Johnson family
    { id: 'johnson-founder', name: 'Marcus Johnson', family_branch: 'Johnson', little_brothers: ['johnson-2', 'johnson-3', 'johnson-4'] },
    { id: 'johnson-2', name: 'Tyler Brown', big_brother: 'johnson-founder', family_branch: 'Johnson', little_brothers: [] },
    { id: 'johnson-3', name: 'Jordan Davis', big_brother: 'johnson-founder', family_branch: 'Johnson', little_brothers: ['johnson-5'] },
    { id: 'johnson-4', name: 'Brandon Miller', big_brother: 'johnson-founder', family_branch: 'Johnson', little_brothers: [] },
    { id: 'johnson-5', name: 'Ethan Taylor', big_brother: 'johnson-3', family_branch: 'Johnson', little_brothers: [] },
  ];

  const buildHierarchy = (familyName: string): TreeNode | null => {
    const familyMembers = mockData.filter(member => member.family_branch === familyName);
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

    // Set up zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    setZoom(zoomBehavior);

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
      
      svg.transition()
        .duration(750)
        .call(zoomBehavior.transform, d3.zoomIdentity.translate(centerX, centerY));
    }
  };

  useEffect(() => {
    const hierarchy = buildHierarchy(selectedFamily);
    setTreeData(hierarchy);
  }, [selectedFamily]);

  useEffect(() => {
    if (treeData) {
      renderTree();
    }
  }, [treeData]);

  const handleFamilyChange = (family: string) => {
    setSelectedFamily(family);
  };

  const handleZoomIn = () => {
    if (zoom && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoom.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (zoom && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoom.scaleBy, 1 / 1.5);
    }
  };

  const handleReset = () => {
    if (zoom && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Fraternity Family Trees
          </h1>
          <p className="text-lg text-slate-600">
            Explore the big and little brother relationships within each family branch
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Family Branch
            </label>
            <Select value={selectedFamily} onValueChange={handleFamilyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a family" />
              </SelectTrigger>
              <SelectContent>
                {families.map((family) => (
                  <SelectItem key={family} value={family}>
                    {family} Family
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 items-end">
            <button
              onClick={handleZoomIn}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Zoom Out
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Tree Visualization */}
        <Card className="p-6 bg-white shadow-lg">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-slate-200">
            <svg
              ref={svgRef}
              width="100%"
              height="600"
              viewBox="0 0 1000 600"
              className="cursor-move"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}
            />
            
            {/* Zoom instructions */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm text-slate-600 shadow-lg">
              <div className="font-medium mb-1">Navigation:</div>
              <div>• Mouse wheel: Zoom in/out</div>
              <div>• Click & drag: Pan around</div>
              <div>• Hover nodes: See details</div>
            </div>
          </div>
        </Card>

        {/* Family Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Current Family</h3>
            <p className="text-2xl font-bold text-blue-600">{selectedFamily}</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Total Members</h3>
            <p className="text-2xl font-bold text-purple-600">
              {treeData ? treeData.descendants().length : 0}
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-2">Tree Depth</h3>
            <p className="text-2xl font-bold text-green-600">
              {treeData ? treeData.height + 1 : 0} generations
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;
