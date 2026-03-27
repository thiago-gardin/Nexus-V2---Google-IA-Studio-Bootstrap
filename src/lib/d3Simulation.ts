import * as d3 from 'd3';
import { PhysicsConfig } from '../config/cockpit.config';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  entity_type: string;
  validation_status: string;
  confidence: number;
  domain_id: string;
  attributes: any;
  provenance: any;
  isFocal?: boolean;
  incidentLinks?: GraphLink[];
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: GraphNode;
  target: GraphNode;
  relation_type: string;
  directionality: 'directed' | 'bidirectional';
  validation_status: string;
  label: string;
}

export function createSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  config: PhysicsConfig,
  width: number,
  height: number
): d3.Simulation<GraphNode, GraphLink> {
  const simulation = d3.forceSimulation<GraphNode, GraphLink>(nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d: any) => d.id).distance(config.linkDistance))
    .force('charge', d3.forceManyBody().strength(config.chargeStrength))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(config.collisionRadius))
    .force('x', d3.forceX(width / 2).strength(config.gravity))
    .force('y', d3.forceY(height / 2).strength(config.gravity))
    .alphaDecay(config.alphaDecay)
    .velocityDecay(config.velocityDecay);

  return simulation;
}

export function updateSimulationPhysics(
  simulation: d3.Simulation<GraphNode, GraphLink>,
  config: PhysicsConfig,
  width: number,
  height: number
): void {
  simulation.force('link', (simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>).distance(config.linkDistance));
  simulation.force('charge', (simulation.force('charge') as d3.ForceManyBody<GraphNode>).strength(config.chargeStrength));
  simulation.force('collide', (simulation.force('collide') as d3.ForceCollide<GraphNode>).radius(config.collisionRadius));
  simulation.force('x', (simulation.force('x') as d3.ForceX<GraphNode>).strength(config.gravity).x(width / 2));
  simulation.force('y', (simulation.force('y') as d3.ForceY<GraphNode>).strength(config.gravity).y(height / 2));
  
  simulation.alphaDecay(config.alphaDecay);
  simulation.velocityDecay(config.velocityDecay);
}
