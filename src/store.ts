import { create } from 'zustand';
import { 
  NexusState, Domain, DomainVersion, Source, LocalEntity, 
  RelationAssertion, TransformationEvent, Provenance, CanonicalEntity, ConflictCase
} from './types';

interface NexusStore extends NexusState {
  loading: boolean;
  conflictCases: Record<string, ConflictCase>;
  fetchState: () => Promise<void>;
  createDomain: (domain: Omit<Domain, 'id' | 'version' | 'created_at' | 'updated_at' | 'status'>, reason: string) => Promise<void>;
  createDomainVersion: (version: Omit<DomainVersion, 'id' | 'version' | 'created_at' | 'updated_at' | 'status'>, reason: string) => Promise<any>;
  activateDomainVersion: (id: string, actor: Provenance, reason: string) => Promise<void>;
  createSource: (source: Omit<Source, 'id' | 'version' | 'created_at' | 'updated_at' | 'validation_status' | 'confidence'>, reason: string) => Promise<void>;
  createLocalEntity: (entity: Omit<LocalEntity, 'id' | 'version' | 'created_at' | 'updated_at' | 'validation_status' | 'confidence' | 'governed_by_domain_version_id'>, reason: string) => Promise<void>;
  createRelationAssertion: (relation: Omit<RelationAssertion, 'id' | 'version' | 'created_at' | 'updated_at' | 'validation_status' | 'confidence' | 'governed_by_domain_version_id'>, reason: string) => Promise<void>;
  validateObject: (objectType: string, objectId: string, actor: Provenance, reason: string) => Promise<void>;
  rejectObject: (objectType: string, objectId: string, actor: Provenance, reason: string) => Promise<void>;
  openConflict: (data: any, reason: string) => Promise<void>;
  promoteToCanonical: (localEntityId: string, actor: Provenance, reason: string) => Promise<void>;
  startIngestionRun: (sourceId: string, actor: Provenance, reason: string) => Promise<void>;
  completeIngestionRun: (id: string, actor: Provenance, reason: string) => Promise<void>;
}

export const useNexusStore = create<NexusStore>((set, get) => ({
  domains: {},
  domainVersions: {},
  sources: {},
  localEntities: {},
  canonicalEntities: {},
  conflictCases: {},
  relationAssertions: {},
  events: [],
  loading: false,

  fetchState: async () => {
    set({ loading: true });
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText} - ${text.substring(0, 100)}`);
        }
        return res.json();
      };

      const [domainsArray, sourcesArray, entitiesArray, relationsArray, eventsArray, conflictsArray, canonicalsArray, domainVersionsArray] = await Promise.all([
        fetchJson('/api/domains'),
        fetchJson('/api/sources'),
        fetchJson('/api/local-entities'),
        fetchJson('/api/relation-assertions'),
        fetchJson('/api/events'),
        fetchJson('/api/governance/conflicts'),
        fetchJson('/api/canonical-entities'),
        fetchJson('/api/domain-versions')
      ]);

      const domains = domainsArray.reduce((acc: Record<string, Domain>, d: Domain) => ({ ...acc, [d.id]: d }), {});
      const sources = sourcesArray.reduce((acc: Record<string, Source>, s: Source) => ({ ...acc, [s.id]: s }), {});
      const localEntities = entitiesArray.reduce((acc: Record<string, LocalEntity>, e: LocalEntity) => ({ ...acc, [e.id]: e }), {});
      const relationAssertions = relationsArray.reduce((acc: Record<string, RelationAssertion>, r: RelationAssertion) => ({ ...acc, [r.id]: r }), {});
      const conflictCases = conflictsArray.reduce((acc: Record<string, ConflictCase>, c: ConflictCase) => ({ ...acc, [c.id]: c }), {});
      const canonicalEntities = canonicalsArray.reduce((acc: Record<string, CanonicalEntity>, c: CanonicalEntity) => ({ ...acc, [c.id]: c }), {});
      const domainVersions = domainVersionsArray.reduce((acc: Record<string, DomainVersion>, d: DomainVersion) => ({ ...acc, [d.id]: d }), {});

      set({ 
        domains, 
        sources, 
        localEntities, 
        relationAssertions, 
        events: eventsArray, 
        conflictCases, 
        canonicalEntities, 
        domainVersions,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to fetch state:', error);
      set({ loading: false });
    }
  },

  createDomain: async (domainData, reason) => {
    try {
      await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            ...domainData, 
            status: 'draft',
            confidence: 1.0,
            validation_status: 'proposed'
          }, 
          reason 
        })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to create domain:', error);
    }
  },

  createDomainVersion: async (versionData, reason) => {
    try {
      const res = await fetch('/api/domain-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            ...versionData, 
            status: 'draft',
            confidence: 1.0,
            validation_status: 'proposed'
          }, 
          reason 
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create domain version');
      }
      const version = await res.json();
      await get().fetchState();
      return version;
    } catch (error) {
      console.error('Failed to create domain version:', error);
      throw error;
    }
  },

  activateDomainVersion: async (id, actor, reason) => {
    try {
      await fetch(`/api/domain-versions/${id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to activate domain version:', error);
    }
  },

  createSource: async (sourceData, reason) => {
    try {
      await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            ...sourceData, 
            confidence: 1.0, 
            validation_status: 'proposed' 
          }, 
          reason 
        })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to create source:', error);
      throw error;
    }
  },

  createLocalEntity: async (entityData, reason) => {
    try {
      const res = await fetch('/api/local-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            ...entityData, 
            confidence: 1.0, 
            validation_status: 'proposed' 
          }, 
          reason 
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create local entity');
      }
      await get().fetchState();
    } catch (error) {
      console.error('Failed to create local entity:', error);
      throw error;
    }
  },

  createRelationAssertion: async (relationData, reason) => {
    try {
      const res = await fetch('/api/relation-assertions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            ...relationData, 
            confidence: 1.0, 
            validation_status: 'proposed' 
          }, 
          reason 
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create relation assertion');
      }
      await get().fetchState();
    } catch (error) {
      console.error('Failed to create relation assertion:', error);
      throw error;
    }
  },

  validateObject: async (objectType, objectId, actor, reason) => {
    try {
      await fetch('/api/governance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectType, objectId, actor, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to validate object:', error);
    }
  },

  rejectObject: async (objectType, objectId, actor, reason) => {
    try {
      await fetch('/api/governance/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectType, objectId, actor, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to reject object:', error);
    }
  },

  openConflict: async (data, reason) => {
    try {
      await fetch('/api/governance/conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to open conflict:', error);
    }
  },

  promoteToCanonical: async (localEntityId, actor, reason) => {
    try {
      await fetch('/api/governance/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localEntityId, actor, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to promote to canonical:', error);
    }
  },

  startIngestionRun: async (sourceId, actor, reason) => {
    try {
      await fetch('/api/ingestion/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, actor, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to start ingestion run:', error);
    }
  },

  completeIngestionRun: async (id, actor, reason) => {
    try {
      await fetch(`/api/ingestion/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, reason })
      });
      await get().fetchState();
    } catch (error) {
      console.error('Failed to complete ingestion run:', error);
    }
  }
}));
