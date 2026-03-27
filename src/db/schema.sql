-- schema.sql

CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL, -- 'draft', 'active', 'deprecated'
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_versions (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES domains(id),
    version_number INTEGER NOT NULL,
    charter_text TEXT NOT NULL,
    schema_json JSON NOT NULL,
    status TEXT NOT NULL, -- 'draft', 'active', 'archived'
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    UNIQUE(domain_id, version_number)
);

CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    uri TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'document', 'api', 'manual', 'agent'
    metadata JSON,
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_entities (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES domains(id),
    governed_by_domain_version_id TEXT NOT NULL REFERENCES domain_versions(id),
    source_id TEXT REFERENCES sources(id),
    entity_type TEXT NOT NULL,
    label TEXT NOT NULL,
    attributes JSON NOT NULL,
    canonical_candidate_flag BOOLEAN DEFAULT 0,
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS canonical_entities (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES domains(id),
    entity_type TEXT NOT NULL,
    label TEXT NOT NULL,
    merged_attributes JSON NOT NULL,
    local_entity_ids JSON NOT NULL, -- Array of local_entity ids
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relation_assertions (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES domains(id),
    governed_by_domain_version_id TEXT NOT NULL REFERENCES domain_versions(id),
    source_id TEXT REFERENCES sources(id),
    source_entity_id TEXT NOT NULL REFERENCES local_entities(id),
    target_entity_id TEXT NOT NULL REFERENCES local_entities(id),
    relation_type TEXT NOT NULL,
    directionality TEXT NOT NULL DEFAULT 'directed',
    attributes JSON NOT NULL,
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transformation_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    target_object_id TEXT NOT NULL,
    target_object_type TEXT NOT NULL,
    actor JSON NOT NULL, -- { actor_id, actor_type }
    reason TEXT NOT NULL,
    payload JSON NOT NULL,
    timestamp TEXT NOT NULL,
    performed_via TEXT,
    before_state_ref TEXT,
    after_state_ref TEXT,
    domain_id TEXT,
    reversible_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES sources(id),
    status TEXT NOT NULL, -- 'running', 'completed', 'failed'
    started_at TEXT NOT NULL,
    completed_at TEXT,
    logs JSON
);

CREATE TABLE IF NOT EXISTS conflict_cases (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES domains(id),
    target_object_id TEXT NOT NULL,
    target_object_type TEXT NOT NULL,
    conflict_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL, -- 'open', 'resolved'
    resolution_notes TEXT,
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_rules (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL REFERENCES domains(id),
    rule_type TEXT NOT NULL,
    description TEXT NOT NULL,
    parameters JSON NOT NULL,
    
    -- ThinCore
    provenance JSON NOT NULL,
    confidence REAL NOT NULL,
    validation_status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
