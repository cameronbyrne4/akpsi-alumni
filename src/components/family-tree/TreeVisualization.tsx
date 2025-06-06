'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Member {
  id: string;
  name: string;
  big_brother: string | null;
  little_brothers: string[];
  family_branch: string;
}

interface TreeVisualizationProps {
  members: Member[];
}

type HierarchyNode = d3.HierarchyNode<Member>;
type HierarchyPointNode = d3.HierarchyPointNode<Member>;
type HierarchyPointLink = d3.HierarchyPointLink<Member>;

export function TreeVisualization({ members }: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || members.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Create hierarchy
    const memberMap = new Map(members.map(m => [m.id, m]));
    const root = members.find(m => !m.big_brother);
    if (!root) return;

    const hierarchy = d3.hierarchy(root, (d: Member) => 
      d.little_brothers.map(id => memberMap.get(id)).filter(Boolean) as Member[]
    );

    // Set up the tree layout
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    const treeLayout = d3.tree<Member>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const treeData = treeLayout(hierarchy);

    // Create SVG group for zooming
    const g = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3]) // Allow zooming out more and in more
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    d3.select(svgRef.current)
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity.translate(width / 2, 0).scale(0.8)); // Center the tree initially

    // Draw links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<HierarchyPointLink, HierarchyPointNode>()
        .x((d: any) => d.y)
        .y((d: any) => d.x))
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5);

    // Draw nodes
    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Add circles
    node.append('circle')
      .attr('r', 10)
      .attr('fill', '#fff')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 15);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 10);
      })
      .on('click', function(event, d: HierarchyPointNode) {
        event.stopPropagation();
        console.log('Clicked member:', d.data);
      });

    // Add labels
    node.append('text')
      .attr('dy', '.31em')
      .attr('x', d => d.children ? -13 : 13)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .style('cursor', 'pointer')
      .on('click', function(event, d: HierarchyPointNode) {
        event.stopPropagation();
        console.log('Clicked member:', d.data);
      });

  }, [members]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
} 