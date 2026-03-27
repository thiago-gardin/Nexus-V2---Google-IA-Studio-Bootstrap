import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { RefreshCw, Network } from 'lucide-react';
import { ENTITY_STYLES, PhysicsConfig, getDomainColor } from '../config/cockpit.config';
import { createSimulation, updateSimulationPhysics, GraphNode, GraphLink } from '../lib/d3Simulation';

interface GraphViewProps {
  nodes: any[];
  links: any[];
  loading: boolean;
  onNodeSelect: (node: any) => void;
  physics: PhysicsConfig;
  resetTrigger: number;
  zoomTrigger: { type: 'in' | 'out' | 'fit' | null };
  onZoomEnd: () => void;
  onNodeRightClick?: (entity: any, x: number, y: number) => void
  onEdgeClick?: (edge: any) => void
  colorMode: 'by_type' | 'by_domain' | 'by_status';
  sizeMode: 'uniform' | 'by_type' | 'by_degree' | 'by_confidence';
  showLabels: boolean;
  labelMinZoom: number;
  clusterByDomain: boolean;
  crossDomainMode: 'show_all' | 'proposed_only' | 'hide';
  domainColorBorders: boolean;
  domains: any;
}

const getEntityStyle = (type: string) => ENTITY_STYLES[type] || ENTITY_STYLES.default;

export const GraphView: React.FC<GraphViewProps> = ({
  nodes: rawNodes, links: rawLinks, loading, onNodeSelect, onNodeRightClick, onEdgeClick, physics, resetTrigger, zoomTrigger, onZoomEnd,
  colorMode, sizeMode, showLabels, labelMinZoom, clusterByDomain, crossDomainMode, domainColorBorders, domains
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = rawNodes.map(n => ({ ...n, incidentLinks: [] }));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links: GraphLink[] = rawLinks
      .filter(l => nodeMap.has(l.source_id || l.source) && nodeMap.has(l.target_id || l.target))
      .map(l => {
        const source = nodeMap.get(l.source_id || l.source)!;
        const target = nodeMap.get(l.target_id || l.target)!;
        const link = { 
          ...l, 
          source, 
          target, 
          label: l.relation_type,
          isCrossD: (source as any).domain_id !== (target as any).domain_id
        };
        source.incidentLinks?.push(link);
        target.incidentLinks?.push(link);
        return link;
      });
    return { nodes, links };
  }, [rawNodes, rawLinks]);

  const getNodeRadius = (d: any) => {
    if (sizeMode === 'uniform') return d.isFocal ? 28 : 20;
    if (sizeMode === 'by_type') {
      const radii: Record<string, number> = { Project: 28, Person: 24, Task: 20 };
      return radii[d.entity_type] || 18;
    }
    if (sizeMode === 'by_degree') {
      const degree = d.incidentLinks?.length || 0;
      return Math.min(32, Math.max(12, 12 + degree * 3));
    }
    if (sizeMode === 'by_confidence') {
      return Math.max(12, (d.confidence || 0.5) * 28);
    }
    return 20;
  };

  const getNodeColor = (d: any) => {
    if (colorMode === 'by_type') return getEntityStyle(d.entity_type).bg;
    if (colorMode === 'by_domain') {
      const domain = domains[d.domain_id];
      return getDomainColor(domain?.slug || '');
    }
    if (colorMode === 'by_status') {
      if (d.validation_status === 'proposed') return '#f59e0b';
      if (d.validation_status === 'validated') return '#10b981';
      if (d.validation_status === 'rejected') return '#ef4444';
    }
    return getEntityStyle(d.entity_type).bg;
  };

  const getNodeStroke = (d: any) => {
    if (domainColorBorders) {
      const domain = domains[d.domain_id];
      return getDomainColor(domain?.slug || '');
    }
    if (colorMode === 'by_domain') {
      const domain = domains[d.domain_id];
      const baseColor = getDomainColor(domain?.slug || '');
      return baseColor + 'aa';
    }
    return getEntityStyle(d.entity_type).border;
  };

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    svg.selectAll('*').remove();
    
    const g = svg.append('g').attr('class', 'graph-container');
    const hullLayer = g.append('g').attr('class', 'hull-layer');
    const linkLayer = g.append('g').attr('class', 'link-layer');
    const nodeLayer = g.append('g').attr('class', 'node-layer');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (e) => {
        currentTransformRef.current = e.transform;
        g.attr('transform', e.transform);
        updateLabelVisibility();
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    svg.append('defs').append('marker').attr('id', 'arrowhead').attr('viewBox', '-0 -5 10 10').attr('refX', 30).attr('refY', 0).attr('orient', 'auto').attr('markerWidth', 6).attr('markerHeight', 6).append('path').attr('d', 'M 0,-5 L 10 ,0 L 0,5').attr('fill', '#52525b');

    const simulation = createSimulation(graphData.nodes, graphData.links, physics, width, height);
    simulationRef.current = simulation;

    const link = linkLayer.selectAll('line')
      .data(graphData.links)
      .enter().append('line')
      .attr('stroke', (d: any) => d.isCrossD ? '#f59e0b' : '#3f3f46')
      .attr('stroke-width', (d: any) => d.isCrossD ? 2 : 1.5)
      .attr('stroke-dasharray', (d: any) => d.isCrossD ? '6,3' : (d.directionality === 'bidirectional' ? '4,4' : '0'))
      .attr('opacity', (d: any) => d.isCrossD ? 0.8 : 1)
      .attr('marker-end', (d: any) => d.directionality === 'directed' ? 'url(#arrowhead)' : '')
      .on('click', (event: any, d: any) => {
        event.stopPropagation()
        onEdgeClick?.(d)
      })
      .style('cursor', 'pointer');

    const linkLabel = linkLayer.selectAll('.link-label')
      .data(graphData.links)
      .enter().append('g')
      .attr('class', 'link-label');
    
    linkLabel.append('rect').attr('rx', 4).attr('ry', 4).attr('fill', '#18181b').attr('stroke', '#27272a').attr('stroke-width', 0.5);
    linkLabel.append('text').attr('text-anchor', 'middle').attr('alignment-baseline', 'middle').attr('fill', '#71717a').attr('font-size', '8px').attr('font-weight', 'bold').text((d: any) => d.label);

    const node = nodeLayer.selectAll('.node-group')
      .data(graphData.nodes)
      .enter().append('g')
      .attr('class', 'node-group')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('click', (e, d: any) => { onNodeSelect(d); highlightNode(d.id); })
      .on('contextmenu', (event: any, d: any) => {
        event.preventDefault()
        event.stopPropagation()
        if (onNodeRightClick) onNodeRightClick(d, event.clientX, event.clientY)
      });

    node.append('circle')
      .attr('r', getNodeRadius)
      .attr('fill', getNodeColor)
      .attr('stroke', getNodeStroke)
      .attr('stroke-width', 2)
      .attr('class', 'node-circle transition-all duration-300');

    node.append('g').attr('transform', 'translate(-7, -7) scale(0.5833)').attr('pointer-events', 'none').append('path').attr('d', (d: any) => getEntityStyle(d.entity_type).svgPath).attr('stroke', '#ffffff').attr('stroke-width', 1.5).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('fill', 'none').attr('opacity', 0.85);

    const labels = node.append('text')
      .attr('dy', (d: any) => getNodeRadius(d) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#a1a1aa')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .attr('class', 'node-label')
      .text((d: any) => d.label.length > 16 ? d.label.substring(0, 14) + '...' : d.label);

    const updateLabelVisibility = () => {
      const scale = currentTransformRef.current.k;
      labels.style('opacity', (d: any) => {
        if (!showLabels) return 0;
        if (d.isFocal) return 1;
        return scale >= labelMinZoom ? 1 : 0;
      });
      linkLabel.style('opacity', showLabels ? 1 : 0);
    };

    updateLabelVisibility();

    const hulls = hullLayer.selectAll('.domain-hull');

    simulation.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y).attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      linkLabel.attr('transform', (d: any) => `translate(${(d.source.x + d.target.x) / 2},${(d.source.y + d.target.y) / 2})`);
      linkLabel.select('rect').attr('width', (d: any) => d.label.length * 5 + 8).attr('height', 12).attr('x', (d: any) => -(d.label.length * 5 + 8) / 2).attr('y', -6);
      node.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);

      if (clusterByDomain) {
        const domainGroups = d3.group(graphData.nodes, (d: any) => d.domain_id);
        const hullData = Array.from(domainGroups.entries()).map(([domainId, nodes]) => {
          if (nodes.length < 1) return null;
          const x0 = d3.min(nodes, (d: any) => d.x)! - 40;
          const y0 = d3.min(nodes, (d: any) => d.y)! - 40;
          const x1 = d3.max(nodes, (d: any) => d.x)! + 40;
          const y1 = d3.max(nodes, (d: any) => d.y)! + 40;
          return { domainId, x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
        }).filter(Boolean);

        const hullSelection = hullLayer.selectAll('rect').data(hullData, (d: any) => d.domainId);
        
        hullSelection.enter()
          .append('rect')
          .attr('rx', 20).attr('ry', 20)
          .attr('fill', (d: any) => {
            const domain = domains[d.domainId];
            return getDomainColor(domain?.slug || '');
          })
          .attr('opacity', 0.05)
          .merge(hullSelection as any)
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y)
          .attr('width', (d: any) => d.width)
          .attr('height', (d: any) => d.height);

        hullSelection.exit().remove();
      } else {
        hullLayer.selectAll('rect').remove();
      }
    });

    function highlightNode(id: string) {
      const neighbors = new Set([id]);
      graphData.links.forEach((l: any) => { if (l.source.id === id) neighbors.add(l.target.id); if (l.target.id === id) neighbors.add(l.source.id); });
      node.transition().duration(300).style('opacity', (d: any) => neighbors.has(d.id) ? 1 : 0.2);
      link.transition().duration(300).style('opacity', (d: any) => (d.source.id === id || d.target.id === id) ? 1 : 0.1).attr('stroke', (d: any) => (d.source.id === id || d.target.id === id) ? '#10b981' : '#3f3f46');
      node.select('.node-circle').attr('stroke', (d: any) => d.id === id ? '#10b981' : getNodeStroke(d)).attr('stroke-width', (d: any) => d.id === id ? 4 : 2).style('filter', (d: any) => d.id === id ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' : 'none');
    }

    setTimeout(() => {
      const bounds = g.node()?.getBBox();
      if (bounds && bounds.width > 0) {
        const scale = 0.8 / Math.max(bounds.width / width, bounds.height / height);
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2)));
      }
    }, 500);
  }, [graphData, colorMode, sizeMode, showLabels, labelMinZoom, clusterByDomain, domainColorBorders]);

  useEffect(() => {
    if (!simulationRef.current) return;
    updateSimulationPhysics(simulationRef.current, physics, containerRef.current?.clientWidth || 800, containerRef.current?.clientHeight || 600);
    simulationRef.current.alpha(0.3).restart();
  }, [physics]);

  useEffect(() => {
    if (!zoomRef.current || !svgRef.current || !zoomTrigger.type) return;
    const svg = d3.select(svgRef.current);
    if (zoomTrigger.type === 'in') svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    else if (zoomTrigger.type === 'out') svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    else if (zoomTrigger.type === 'fit') {
      const g = svg.select('.graph-container');
      const bounds = (g.node() as any)?.getBBox();
      if (bounds) {
        const fullWidth = containerRef.current?.clientWidth || 800;
        const fullHeight = containerRef.current?.clientHeight || 600;
        const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
        svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity.translate(fullWidth / 2, fullHeight / 2).scale(scale).translate(-(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2)));
      }
    }
    onZoomEnd();
  }, [zoomTrigger]);

  useEffect(() => { if (resetTrigger > 0 && simulationRef.current) simulationRef.current.alpha(1).restart(); }, [resetTrigger]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {loading && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-50"><div className="flex flex-col items-center gap-3"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synthesizing Graph...</span></div></div>}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {!loading && graphData.nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="flex flex-col items-center gap-4 opacity-20"><Network className="w-24 h-24 text-zinc-500" /><span className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">No Data to Explore</span></div></div>}
    </div>
  );
};
