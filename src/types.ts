export type ValidationStatus = 'proposed' | 'validated' | 'rejected' | 'conflict' | 'deprecated';
export type DomainStatus = 'draft' | 'active' | 'suspended' | 'archived';

export interface Provenance {
  actor_id: string;
  actor_type: 'human' | 'agent' | 'system';
  performed_via: string;
}

export interface ThinCore {
  provenance: Provenance;
  confidence: number;
  validation_status: ValidationStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Domain extends ThinCore {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: DomainStatus;
}

export interface DomainVersion extends ThinCore {
  id: string;
  domain_id: string;
  version_number: number;
  charter_text: string;
  schema_json: {
    allowed_entity_types: string[];
    allowed_relation_types: string[];
    required_fields_by_type: Record<string, string[]>;
  };
  status: 'draft' | 'active' | 'archived';
}

export interface Source extends ThinCore {
  id: string;
  uri: string;
  type: 'document' | 'api' | 'manual' | 'agent';
  metadata: Record<string, any>;
}

export interface LocalEntity extends ThinCore {
  id: string;
  domain_id: string;
  governed_by_domain_version_id: string;
  source_id?: string;
  entity_type: string;
  label: string;
  attributes: Record<string, any>;
  canonical_candidate_flag?: boolean;
}

export interface CanonicalEntity extends ThinCore {
  id: string;
  domain_id: string;
  entity_type: string;
  label: string;
  merged_attributes: Record<string, any>;
  local_entity_ids: string[];
}

export interface RelationAssertion extends ThinCore {
  id: string;
  domain_id: string;
  governed_by_domain_version_id: string;
  source_id?: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  directionality: 'directed' | 'bidirectional';
  attributes: Record<string, any>;
}

export interface TransformationEvent {
  id: string;
  event_type: string;
  target_object_id: string;
  target_object_type: string;
  actor: {
    actor_id: string;
    actor_type: 'human' | 'agent' | 'system';
  };
  reason: string;
  payload: Record<string, any>;
  timestamp: string;
  performed_via?: string;
  before_state_ref?: string;
  after_state_ref?: string;
  domain_id?: string;
  reversible_flag?: boolean;
}

export interface IngestionRun {
  id: string;
  source_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  logs: any[];
}

export interface ConflictCase extends ThinCore {
  id: string;
  domain_id: string;
  target_object_id: string;
  target_object_type: string;
  conflict_type: string;
  description: string;
  status: 'open' | 'resolved';
  resolution_notes?: string;
}

export interface GovernanceRule extends ThinCore {
  id: string;
  domain_id: string;
  rule_type: string;
  description: string;
  parameters: Record<string, any>;
}

// Keep NexusState for frontend UI state management, but it will be populated from API
export interface NexusState {
  domains: Record<string, Domain>;
  domainVersions: Record<string, DomainVersion>;
  sources: Record<string, Source>;
  localEntities: Record<string, LocalEntity>;
  canonicalEntities: Record<string, CanonicalEntity>;
  relationAssertions: Record<string, RelationAssertion>;
  events: TransformationEvent[];
}

