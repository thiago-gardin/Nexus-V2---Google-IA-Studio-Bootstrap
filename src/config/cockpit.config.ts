import { NexusState } from '../types';

export interface EntityStyle {
  bg: string;
  border: string;
  text: string;
  icon: string;
  svgPath: string;
}

export interface PhysicsConfig {
  linkDistance: number;
  chargeStrength: number;
  gravity: number;
  collisionRadius: number;
  alphaDecay: number;
  velocityDecay: number;
}

export interface SurfaceConfig {
  defaultSurface: string;
  graphDepth: number;
  graphMode: 'focus' | 'full';
  eventPollingInterval: number;
  maxItemsPerList: number;
}

export interface DecisionQueueRule {
  id: string;
  label: string;
  condition: (state: NexusState & { conflictCases: any }) => boolean;
  priority: number;
  targetTab: string;
}

export type HealthStatus = 'healthy' | 'attention' | 'critical';

// ENTITY_STYLES: cores e ícones por entity_type
export const ENTITY_STYLES: Record<string, EntityStyle> = {
  Project: { 
    bg: '#4f46e5', border: '#818cf8', text: '#e0e7ff', icon: '#c7d2fe',
    svgPath: "M3 7h18M3 12h18M3 17h18" 
  },
  Task: { 
    bg: '#d97706', border: '#fbbf24', text: '#fef3c7', icon: '#fde68a',
    svgPath: "M5 13l4 4L19 7" 
  },
  Decision: { 
    bg: '#059669', border: '#34d399', text: '#ecfdf5', icon: '#a7f3d0',
    svgPath: "M12 2l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" 
  },
  Risk: { 
    bg: '#dc2626', border: '#f87171', text: '#fef2f2', icon: '#fecaca',
    svgPath: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" 
  },
  Stakeholder: { 
    bg: '#3b82f6', border: '#60a5fa', text: '#eff6ff', icon: '#dbeafe',
    svgPath: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
  },
  Artifact: { 
    bg: '#8b5cf6', border: '#a78bfa', text: '#f5f3ff', icon: '#ede9fe',
    svgPath: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" 
  },
  Person: { 
    bg: '#6366f1', border: '#818cf8', text: '#e0e7ff', icon: '#c7d2fe',
    svgPath: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
  },
  default: { 
    bg: '#3f3f46', border: '#71717a', text: '#f4f4f5', icon: '#d4d4d8',
    svgPath: "M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0" 
  }
};

// ACTOR_COLORS: codificação visual por actor_type
export const ACTOR_COLORS: Record<string, string> = {
  agent: '#3b82f6',
  human: '#71717a',
  system: '#f59e0b'
};

// VALIDATION_STYLES: fundo de linha por validation_status
export const VALIDATION_BG: Record<string, string> = {
  proposed: 'rgba(245,158,11,0.06)',
  validated: 'transparent',
  rejected: 'rgba(239,68,68,0.06)',
  contested: 'rgba(139,92,246,0.06)'
};

// THRESHOLDS: limites de tempo para pressão visual (em ms)
export const THRESHOLDS = {
  PROPOSED_STALE_WARN: 3600000, // 1h
  PROPOSED_STALE_CRITICAL: 86400000, // 24h
  CONFLICT_STALE: 172800000 // 48h
};

// HEALTH_RULES: critérios de Healthy/Attention/Critical
export function getSystemHealth(conflicts: number, proposed: number): HealthStatus {
  if (conflicts >= 3) return 'critical';
  if (proposed > 0 || conflicts > 0) return 'attention';
  return 'healthy';
}

// PHYSICS_DEFAULTS: defaults da simulação D3
export const PHYSICS_DEFAULTS: PhysicsConfig = {
  linkDistance: 150,
  chargeStrength: -400,
  gravity: 0.05,
  collisionRadius: 50,
  alphaDecay: 0.028,
  velocityDecay: 0.4
};

// SURFACE_DEFAULTS: configurações padrão de cada superfície
export const SURFACE_DEFAULTS: SurfaceConfig = {
  defaultSurface: 'overview',
  graphDepth: 2,
  graphMode: 'focus',
  eventPollingInterval: 5000,
  maxItemsPerList: 50
};

// DECISION_QUEUE_RULES: prioridade do queue (array ordenado)
export const DECISION_QUEUE_RULES: DecisionQueueRule[] = [
  {
    id: 'conflicts',
    label: 'Open conflicts require resolution',
    condition: (state) => Object.values(state.conflictCases || {}).filter((c: any) => c.status === 'open').length > 0,
    priority: 1,
    targetTab: 'governance'
  },
  {
    id: 'proposed',
    label: 'Entities awaiting validation',
    condition: (state) => Object.values(state.localEntities || {}).filter((e: any) => e.validation_status === 'proposed').length > 0,
    priority: 2,
    targetTab: 'governance'
  },
  {
    id: 'draft_domains',
    label: 'Draft domains not yet active',
    condition: (state) => Object.values(state.domains || {}).filter((d: any) => d.status === 'draft').length > 0,
    priority: 3,
    targetTab: 'governance'
  }
];

export const CHARTER_MODE: 'permissive' | 'strict' = 'permissive';

export const DOMAIN_COLORS: Record<string, string> = {
  'projects-governance': '#6366f1',
  'email-communications': '#0ea5e9',
  'people-network': '#10b981',
  default: '#71717a'
};

// Paleta de fallback para domínios emergentes
// Usa o slug para gerar cor determinística
export function getDomainColor(slug: string): string {
  const known = DOMAIN_COLORS[slug];
  if (known) return known;
  const palette = ['#8b5cf6','#f59e0b','#ec4899','#14b8a6','#f97316','#a3e635'];
  let hash = 0;
  for (let i = 0; i < slug.length; i++)
    hash = (hash * 31 + slug.charCodeAt(i)) % palette.length;
  return palette[Math.abs(hash)];
}
