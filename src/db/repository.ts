import db from './index.js';
import { 
  Domain, DomainVersion, LocalEntity, RelationAssertion, 
  TransformationEvent, CanonicalEntity, ConflictCase, Provenance, Source, GovernanceRule
} from '../types.js';

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

function insertEvent(event: TransformationEvent) {
  const stmt = db.prepare(`
    INSERT INTO transformation_events (
      id, event_type, target_object_id, target_object_type, actor, reason, payload, timestamp,
      performed_via, before_state_ref, after_state_ref, domain_id, reversible_flag
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    event.id, event.event_type, event.target_object_id, event.target_object_type,
    JSON.stringify(event.actor), event.reason, JSON.stringify(event.payload), event.timestamp,
    event.performed_via || null, event.before_state_ref || null, event.after_state_ref || null,
    event.domain_id || null, event.reversible_flag ? 1 : 0
  );
}

export const domainRepo = {
  createDomain: (data: Omit<Domain, 'id' | 'version' | 'created_at' | 'updated_at'>, reason: string) => {
    const id = generateId('dom');
    const now = new Date().toISOString();
    const domain: Domain = {
      ...data,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO domains (id, name, slug, description, status, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        domain.id, domain.name, domain.slug, domain.description, domain.status,
        JSON.stringify(domain.provenance), domain.confidence, domain.validation_status,
        domain.version, domain.created_at, domain.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'DOMAIN_CREATED',
        target_object_id: domain.id,
        target_object_type: 'Domain',
        actor: domain.provenance,
        reason,
        payload: domain,
        timestamp: now,
        domain_id: domain.id,
        performed_via: domain.provenance.performed_via
      });
    })();

    return domain;
  },

  getDomains: (): Domain[] => {
    const rows = db.prepare('SELECT * FROM domains').all() as any[];
    return rows.map(row => ({
      ...row,
      provenance: JSON.parse(row.provenance)
    }));
  },

  getDomain: (id: string): Domain | undefined => {
    const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return { ...row, provenance: JSON.parse(row.provenance) };
  },

  createDomainVersion: (data: Omit<DomainVersion, 'id' | 'version' | 'created_at' | 'updated_at'>, reason: string) => {
    const id = generateId('dver');
    const now = new Date().toISOString();
    const version: DomainVersion = {
      ...data,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO domain_versions (id, domain_id, version_number, charter_text, schema_json, status, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        version.id, version.domain_id, version.version_number, version.charter_text, JSON.stringify(version.schema_json), version.status,
        JSON.stringify(version.provenance), version.confidence, version.validation_status,
        version.version, version.created_at, version.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'DOMAIN_VERSION_CREATED',
        target_object_id: version.id,
        target_object_type: 'DomainVersion',
        actor: version.provenance,
        reason,
        payload: version,
        timestamp: now,
        domain_id: version.domain_id,
        performed_via: version.provenance.performed_via
      });
    })();

    return version;
  },

  activateDomainVersion: (id: string, actor: Provenance, reason: string) => {
    const version = db.prepare('SELECT * FROM domain_versions WHERE id = ?').get(id) as any;
    if (!version) throw new Error('Domain version not found');

    const now = new Date().toISOString();

    db.transaction(() => {
      // Deactivate other versions
      db.prepare('UPDATE domain_versions SET status = ? WHERE domain_id = ?').run('archived', version.domain_id);
      
      // Activate this one
      db.prepare('UPDATE domain_versions SET status = ?, updated_at = ?, version = version + 1 WHERE id = ?').run('active', now, id);

      insertEvent({
        id: generateId('evt'),
        event_type: 'DOMAIN_VERSION_ACTIVATED',
        target_object_id: id,
        target_object_type: 'DomainVersion',
        actor,
        reason,
        payload: { status: 'active' },
        timestamp: now,
        domain_id: version.domain_id,
        performed_via: actor.performed_via
      });
    })();
  },

  getActiveDomainVersion: (domainId: string): DomainVersion | undefined => {
    const row = db.prepare('SELECT * FROM domain_versions WHERE domain_id = ? AND status = ?').get(domainId, 'active') as any;
    if (!row) return undefined;
    return { ...row, provenance: JSON.parse(row.provenance), schema_json: JSON.parse(row.schema_json) };
  },
  
  getDomainVersions: (): DomainVersion[] => {
    const rows = db.prepare('SELECT * FROM domain_versions').all() as any[];
    return rows.map(row => ({
      ...row,
      provenance: JSON.parse(row.provenance),
      schema_json: JSON.parse(row.schema_json)
    }));
  }
};

export const sourceRepo = {
  createSource: (data: Omit<Source, 'id' | 'version' | 'created_at' | 'updated_at'>, reason: string) => {
    const id = generateId('src');
    const now = new Date().toISOString();
    
    const source: Source = {
      ...data,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO sources (id, uri, type, metadata, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        source.id, source.uri, source.type, JSON.stringify(source.metadata),
        JSON.stringify(source.provenance), source.confidence, source.validation_status,
        source.version, source.created_at, source.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'SOURCE_CREATED',
        target_object_id: source.id,
        target_object_type: 'Source',
        actor: source.provenance,
        reason,
        payload: source,
        timestamp: now,
        performed_via: source.provenance.performed_via
      });
    })();

    return source;
  },

  getSources: (): Source[] => {
    const rows = db.prepare('SELECT * FROM sources').all() as any[];
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata),
      provenance: JSON.parse(row.provenance)
    }));
  },

  getSource: (id: string): Source | undefined => {
    const row = db.prepare('SELECT * FROM sources WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return { ...row, metadata: JSON.parse(row.metadata), provenance: JSON.parse(row.provenance) };
  }
};

export const entityRepo = {
  createLocalEntity: (data: Omit<LocalEntity, 'id' | 'version' | 'created_at' | 'updated_at' | 'governed_by_domain_version_id'>, reason: string) => {
    const id = generateId('ent');
    const now = new Date().toISOString();
    
    // Ensure domain version is active
    const activeVersion = domainRepo.getActiveDomainVersion(data.domain_id);
    if (!activeVersion) {
      throw new Error('No active domain version found for this domain');
    }

    const schema = activeVersion.schema_json;
    const isKnownType = schema?.allowed_entity_types
      ? schema.allowed_entity_types.includes(data.entity_type)
      : true;
    const warnings = isKnownType
      ? []
      : [`entity_type '${data.entity_type}' not in charter — added as unlisted`];

    if (isKnownType && schema && schema.required_fields_by_type && schema.required_fields_by_type[data.entity_type]) {
      const requiredFields = schema.required_fields_by_type[data.entity_type];
      for (const field of requiredFields) {
        if (data.attributes[field] === undefined || data.attributes[field] === null) {
          throw new Error(`Missing required field '${field}' for entity type '${data.entity_type}'.`);
        }
      }
    }

    const entity: LocalEntity = {
      ...data,
      validation_status: isKnownType ? data.validation_status : 'proposed',
      governed_by_domain_version_id: activeVersion.id,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO local_entities (id, domain_id, governed_by_domain_version_id, source_id, entity_type, label, attributes, canonical_candidate_flag, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        entity.id, entity.domain_id, entity.governed_by_domain_version_id, entity.source_id,
        entity.entity_type, entity.label, JSON.stringify(entity.attributes),
        entity.canonical_candidate_flag ? 1 : 0,
        JSON.stringify(entity.provenance), entity.confidence, entity.validation_status,
        entity.version, entity.created_at, entity.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'LOCAL_ENTITY_CREATED',
        target_object_id: entity.id,
        target_object_type: 'LocalEntity',
        actor: entity.provenance,
        reason,
        payload: { ...entity, warnings },
        timestamp: now,
        domain_id: entity.domain_id,
        performed_via: entity.provenance.performed_via
      });
    })();

    return entity;
  },

  getLocalEntities: (): LocalEntity[] => {
    const rows = db.prepare('SELECT * FROM local_entities').all() as any[];
    return rows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance),
      canonical_candidate_flag: !!row.canonical_candidate_flag
    }));
  },

  getLocalEntity: (id: string): LocalEntity | undefined => {
    const row = db.prepare('SELECT * FROM local_entities WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance),
      canonical_candidate_flag: !!row.canonical_candidate_flag
    };
  }
};

export const relationRepo = {
  createRelationAssertion: (data: Omit<RelationAssertion, 'id' | 'version' | 'created_at' | 'updated_at' | 'governed_by_domain_version_id'>, reason: string) => {
    const id = generateId('rel');
    const now = new Date().toISOString();

    // Ensure domain version is active
    const activeVersion = domainRepo.getActiveDomainVersion(data.domain_id);
    if (!activeVersion) {
      throw new Error('No active domain version found for this domain');
    }

    const schema = activeVersion.schema_json;
    const isKnownType = schema?.allowed_relation_types
      ? schema.allowed_relation_types.includes(data.relation_type)
      : true;
    const warnings = isKnownType
      ? []
      : [`relation_type '${data.relation_type}' not in charter — added as unlisted`];

    const relation: RelationAssertion = {
      ...data,
      governed_by_domain_version_id: activeVersion.id,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO relation_assertions (id, domain_id, governed_by_domain_version_id, source_id, source_entity_id, target_entity_id, relation_type, directionality, attributes, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        relation.id, relation.domain_id, relation.governed_by_domain_version_id, relation.source_id,
        relation.source_entity_id, relation.target_entity_id, relation.relation_type, relation.directionality,
        JSON.stringify(relation.attributes), JSON.stringify(relation.provenance),
        relation.confidence, relation.validation_status, relation.version,
        relation.created_at, relation.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'RELATION_ASSERTION_CREATED',
        target_object_id: relation.id,
        target_object_type: 'RelationAssertion',
        actor: relation.provenance,
        reason,
        payload: { ...relation, warnings },
        timestamp: now,
        domain_id: relation.domain_id,
        performed_via: relation.provenance.performed_via
      });
    })();

    return relation;
  },

  getRelationAssertions: (): RelationAssertion[] => {
    const rows = db.prepare('SELECT * FROM relation_assertions').all() as any[];
    return rows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));
  },

  getRelationTypes: (domainId: string): { type: string, count: number, in_charter: boolean }[] => {
    const activeVersion = domainRepo.getActiveDomainVersion(domainId);
    const allowedTypes = activeVersion?.schema_json?.allowed_relation_types || [];

    const usedTypes = db.prepare(`
      SELECT relation_type as type, COUNT(*) as count
      FROM relation_assertions
      WHERE domain_id = ?
      GROUP BY relation_type
      ORDER BY count DESC
    `).all(domainId) as { type: string, count: number }[];

    const result = [...usedTypes];

    // Add types from charter that are not used yet
    for (const type of allowedTypes) {
      if (!result.find(r => r.type === type)) {
        result.push({ type, count: 0 });
      }
    }

    return result.map(r => ({
      ...r,
      in_charter: allowedTypes.includes(r.type)
    }));
  }
};

export const governanceRepo = {
  validateObject: (objectType: string, objectId: string, actor: Provenance, reason: string) => {
    const tableMap: Record<string, string> = {
      'Domain': 'domains',
      'DomainVersion': 'domain_versions',
      'LocalEntity': 'local_entities',
      'RelationAssertion': 'relation_assertions',
      'CanonicalEntity': 'canonical_entities',
      'Source': 'sources'
    };
    
    const table = tableMap[objectType];
    if (!table) throw new Error('Invalid object type');

    const now = new Date().toISOString();

    db.transaction(() => {
      const beforeSnapshot = db.prepare(
        `SELECT * FROM ${table} WHERE id = ?`
      ).get(objectId) as any;

      db.prepare(`UPDATE ${table} SET validation_status = ?, updated_at = ?, version = version + 1 WHERE id = ?`).run('validated', now, objectId);

      insertEvent({
        id: generateId('evt'),
        event_type: 'OBJECT_VALIDATED',
        target_object_id: objectId,
        target_object_type: objectType,
        actor,
        reason,
        payload: { validation_status: 'validated' },
        timestamp: now,
        performed_via: actor.performed_via,
        before_state_ref: JSON.stringify({
          validation_status: beforeSnapshot.validation_status,
          version: beforeSnapshot.version
        }),
        after_state_ref: JSON.stringify({
          validation_status: 'validated',
          version: beforeSnapshot.version + 1
        }),
        reversible_flag: true
      });
    })();
  },

  rejectObject: (objectType: string, objectId: string, actor: Provenance, reason: string) => {
    const tableMap: Record<string, string> = {
      'Domain': 'domains',
      'DomainVersion': 'domain_versions',
      'LocalEntity': 'local_entities',
      'RelationAssertion': 'relation_assertions',
      'CanonicalEntity': 'canonical_entities',
      'Source': 'sources'
    };
    
    const table = tableMap[objectType];
    if (!table) throw new Error('Invalid object type');

    const now = new Date().toISOString();

    db.transaction(() => {
      const beforeSnapshot = db.prepare(
        `SELECT * FROM ${table} WHERE id = ?`
      ).get(objectId) as any;

      db.prepare(`UPDATE ${table} SET validation_status = ?, updated_at = ?, version = version + 1 WHERE id = ?`).run('rejected', now, objectId);

      insertEvent({
        id: generateId('evt'),
        event_type: 'OBJECT_REJECTED',
        target_object_id: objectId,
        target_object_type: objectType,
        actor,
        reason,
        payload: { validation_status: 'rejected' },
        timestamp: now,
        performed_via: actor.performed_via,
        before_state_ref: JSON.stringify({
          validation_status: beforeSnapshot.validation_status,
          version: beforeSnapshot.version
        }),
        after_state_ref: JSON.stringify({
          validation_status: 'rejected',
          version: beforeSnapshot.version + 1
        }),
        reversible_flag: true
      });
    })();
  },

  getConflictCases: (): ConflictCase[] => {
    const rows = db.prepare('SELECT * FROM conflict_cases').all() as any[];
    return rows.map(row => ({
      ...row,
      provenance: JSON.parse(row.provenance)
    }));
  },

  getCanonicalEntities: (): CanonicalEntity[] => {
    const rows = db.prepare('SELECT * FROM canonical_entities').all() as any[];
    return rows.map(row => ({
      ...row,
      merged_attributes: JSON.parse(row.merged_attributes),
      local_entity_ids: JSON.parse(row.local_entity_ids),
      provenance: JSON.parse(row.provenance)
    }));
  },

  openConflictCase: (data: Omit<ConflictCase, 'id' | 'version' | 'created_at' | 'updated_at'>, reason: string) => {
    const id = generateId('cfc');
    const now = new Date().toISOString();
    
    const conflict: ConflictCase = {
      ...data,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO conflict_cases (id, domain_id, target_object_id, target_object_type, conflict_type, description, status, resolution_notes, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        conflict.id, conflict.domain_id, conflict.target_object_id, conflict.target_object_type,
        conflict.conflict_type, conflict.description, conflict.status, conflict.resolution_notes,
        JSON.stringify(conflict.provenance), conflict.confidence, conflict.validation_status,
        conflict.version, conflict.created_at, conflict.updated_at
      );

      // Update target object status to 'conflict'
      const tableMap: Record<string, string> = {
        'Domain': 'domains',
        'DomainVersion': 'domain_versions',
        'LocalEntity': 'local_entities',
        'RelationAssertion': 'relation_assertions',
        'CanonicalEntity': 'canonical_entities',
        'Source': 'sources'
      };
      
      const table = tableMap[conflict.target_object_type];
      let beforeSnapshot: any = null;
      if (table) {
        beforeSnapshot = db.prepare(
          `SELECT * FROM ${table} WHERE id = ?`
        ).get(conflict.target_object_id) as any;

        db.prepare(`UPDATE ${table} SET validation_status = ?, updated_at = ?, version = version + 1 WHERE id = ?`).run('conflict', now, conflict.target_object_id);
      }

      insertEvent({
        id: generateId('evt'),
        event_type: 'CONFLICT_OPENED',
        target_object_id: conflict.target_object_id,
        target_object_type: conflict.target_object_type,
        actor: conflict.provenance,
        reason,
        payload: conflict,
        timestamp: now,
        performed_via: conflict.provenance.performed_via,
        before_state_ref: beforeSnapshot ? JSON.stringify({
          validation_status: beforeSnapshot.validation_status,
          version: beforeSnapshot.version
        }) : null,
        after_state_ref: beforeSnapshot ? JSON.stringify({
          validation_status: 'conflict',
          version: beforeSnapshot.version + 1
        }) : null,
        reversible_flag: true
      });
    })();

    return conflict;
  },

  resolveConflictCase: (id: string, resolutionNotes: string, actor: Provenance, reason: string) => {
    const now = new Date().toISOString();
    const conflict = db.prepare('SELECT * FROM conflict_cases WHERE id = ?').get(id) as any;
    if (!conflict) throw new Error('Conflict case not found');

    db.transaction(() => {
      const beforeSnapshot = db.prepare(
        `SELECT * FROM conflict_cases WHERE id = ?`
      ).get(id) as any;

      db.prepare(`UPDATE conflict_cases SET status = ?, resolution_notes = ?, updated_at = ?, version = version + 1 WHERE id = ?`).run('resolved', resolutionNotes, now, id);

      // We should probably update the target object's validation status back to something, but for now we just resolve the case.
      // In a real system, resolving a conflict might involve validating or rejecting the target object.

      insertEvent({
        id: generateId('evt'),
        event_type: 'CONFLICT_RESOLVED',
        target_object_id: id,
        target_object_type: 'ConflictCase',
        actor,
        reason,
        payload: { status: 'resolved', resolution_notes: resolutionNotes },
        timestamp: now,
        performed_via: actor.performed_via,
        before_state_ref: JSON.stringify({
          validation_status: beforeSnapshot.status,
          version: beforeSnapshot.version
        }),
        after_state_ref: JSON.stringify({
          validation_status: 'resolved',
          version: beforeSnapshot.version + 1
        }),
        reversible_flag: true
      });
    })();
  },

  promoteToCanonical: (localEntityId: string, actor: Provenance, reason: string) => {
    const localEntity = entityRepo.getLocalEntity(localEntityId);
    if (!localEntity) throw new Error('Local entity not found');

    const id = generateId('can');
    const now = new Date().toISOString();

    const canonical: CanonicalEntity = {
      id,
      domain_id: localEntity.domain_id,
      entity_type: localEntity.entity_type,
      label: localEntity.label,
      merged_attributes: localEntity.attributes,
      local_entity_ids: [localEntity.id],
      provenance: actor,
      confidence: localEntity.confidence,
      validation_status: 'validated',
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO canonical_entities (id, domain_id, entity_type, label, merged_attributes, local_entity_ids, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        canonical.id, canonical.domain_id, canonical.entity_type, canonical.label,
        JSON.stringify(canonical.merged_attributes), JSON.stringify(canonical.local_entity_ids),
        JSON.stringify(canonical.provenance), canonical.confidence, canonical.validation_status,
        canonical.version, canonical.created_at, canonical.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'PROMOTED_TO_CANONICAL',
        target_object_id: canonical.id,
        target_object_type: 'CanonicalEntity',
        actor,
        reason,
        payload: canonical,
        timestamp: now,
        performed_via: actor.performed_via
      });
    })();

    return canonical;
  },

  createGovernanceRule: (data: Omit<GovernanceRule, 'id' | 'version' | 'created_at' | 'updated_at'>, reason: string) => {
    const id = generateId('gov');
    const now = new Date().toISOString();
    
    const rule: GovernanceRule = {
      ...data,
      id,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO governance_rules (id, domain_id, rule_type, description, parameters, provenance, confidence, validation_status, version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(
        rule.id, rule.domain_id, rule.rule_type, rule.description, JSON.stringify(rule.parameters),
        JSON.stringify(rule.provenance), rule.confidence, rule.validation_status,
        rule.version, rule.created_at, rule.updated_at
      );

      insertEvent({
        id: generateId('evt'),
        event_type: 'GOVERNANCE_RULE_CREATED',
        target_object_id: rule.id,
        target_object_type: 'GovernanceRule',
        actor: rule.provenance,
        reason,
        payload: rule,
        timestamp: now,
        performed_via: rule.provenance.performed_via
      });
    })();

    return rule;
  }
};

export const eventRepo = {
  getEvents: (): TransformationEvent[] => {
    const rows = db.prepare('SELECT * FROM transformation_events ORDER BY timestamp DESC').all() as any[];
    return rows.map(row => ({
      ...row,
      actor: JSON.parse(row.actor),
      payload: JSON.parse(row.payload)
    }));
  }
};

export const ingestionRepo = {
  startIngestionRun: (sourceId: string, actor: Provenance, reason: string) => {
    const id = generateId('ing');
    const now = new Date().toISOString();
    
    const run = {
      id,
      source_id: sourceId,
      status: 'running',
      started_at: now,
      logs: []
    };

    const stmt = db.prepare(`
      INSERT INTO ingestion_runs (id, source_id, status, started_at, logs)
      VALUES (?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      stmt.run(run.id, run.source_id, run.status, run.started_at, JSON.stringify(run.logs));

      insertEvent({
        id: generateId('evt'),
        event_type: 'INGESTION_STARTED',
        target_object_id: run.id,
        target_object_type: 'IngestionRun',
        actor,
        reason,
        payload: run,
        timestamp: now,
        performed_via: actor.performed_via
      });
    })();

    return run;
  },

  completeIngestionRun: (id: string, actor: Provenance, reason: string) => {
    const now = new Date().toISOString();
    
    db.transaction(() => {
      db.prepare(`UPDATE ingestion_runs SET status = ?, completed_at = ? WHERE id = ?`).run('completed', now, id);

      insertEvent({
        id: generateId('evt'),
        event_type: 'INGESTION_COMPLETED',
        target_object_id: id,
        target_object_type: 'IngestionRun',
        actor,
        reason,
        payload: { status: 'completed' },
        timestamp: now,
        performed_via: actor.performed_via
      });
    })();
  }
};
