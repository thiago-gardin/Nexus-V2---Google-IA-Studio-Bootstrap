import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { domainRepo, sourceRepo, entityRepo, relationRepo, governanceRepo, eventRepo, ingestionRepo } from './src/db/repository.js';
import { graphRepo } from './src/db/graphRepo.js';
import db from './src/db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Domains
  app.get('/api/domains', (req, res) => {
    res.json(domainRepo.getDomains());
  });

  app.get('/api/domains/:id', (req, res) => {
    const domain = domainRepo.getDomain(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Not found' });
    res.json(domain);
  });

  app.post('/api/domains', (req, res) => {
    try {
      const { data, reason } = req.body;
      const domain = domainRepo.createDomain(data, reason);
      res.json(domain);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Domain Versions
  app.post('/api/domain-versions', (req, res) => {
    try {
      const { data, reason } = req.body;
      const version = domainRepo.createDomainVersion(data, reason);
      res.json(version);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/domain-versions/:id/activate', (req, res) => {
    try {
      const { actor, reason } = req.body;
      domainRepo.activateDomainVersion(req.params.id, actor, reason);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/domains/:id/active-version', (req, res) => {
    const version = domainRepo.getActiveDomainVersion(req.params.id);
    if (!version) return res.status(404).json({ error: 'No active version found' });
    res.json(version);
  });

  app.get('/api/domains/:id/relation-types', (req, res) => {
    try {
      const relationTypes = relationRepo.getRelationTypes(req.params.id);
      res.json({ relation_types: relationTypes });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/domain-versions', (req, res) => {
    res.json(domainRepo.getDomainVersions());
  });

  // Sources
  app.get('/api/sources', (req, res) => {
    res.json(sourceRepo.getSources());
  });

  app.get('/api/sources/:id', (req, res) => {
    const source = sourceRepo.getSource(req.params.id);
    if (!source) return res.status(404).json({ error: 'Not found' });
    res.json(source);
  });

  app.post('/api/sources', (req, res) => {
    try {
      const { data, reason } = req.body;
      const source = sourceRepo.createSource(data, reason);
      res.json(source);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Local Entities
  app.get('/api/local-entities', (req, res) => {
    res.json(entityRepo.getLocalEntities());
  });

  app.get('/api/local-entities/:id', (req, res) => {
    const entity = entityRepo.getLocalEntity(req.params.id);
    if (!entity) return res.status(404).json({ error: 'Not found' });
    res.json(entity);
  });

  app.post('/api/local-entities', (req, res) => {
    try {
      const { data, reason } = req.body;
      const entity = entityRepo.createLocalEntity(data, reason);
      res.json(entity);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Relation Assertions
  app.get('/api/relation-assertions', (req, res) => {
    res.json(relationRepo.getRelationAssertions());
  });

  app.post('/api/relation-assertions', (req, res) => {
    try {
      const { data, reason } = req.body;
      const relation = relationRepo.createRelationAssertion(data, reason);
      res.json(relation);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Governance
  app.get('/api/governance/conflicts', (req, res) => {
    res.json(governanceRepo.getConflictCases());
  });

  app.get('/api/canonical-entities', (req, res) => {
    res.json(governanceRepo.getCanonicalEntities());
  });

  app.post('/api/governance/validate', (req, res) => {
    try {
      const { objectType, objectId, actor, reason } = req.body;
      governanceRepo.validateObject(objectType, objectId, actor, reason);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/governance/reject', (req, res) => {
    try {
      const { objectType, objectId, actor, reason } = req.body;
      governanceRepo.rejectObject(objectType, objectId, actor, reason);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/governance/conflict', (req, res) => {
    try {
      const { data, reason } = req.body;
      const conflict = governanceRepo.openConflictCase(data, reason);
      res.json(conflict);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/governance/conflict/:id/resolve', (req, res) => {
    try {
      const { id } = req.params;
      const { resolution_notes, actor_id } = req.body;
      if (!resolution_notes)
        return res.status(400).json({ error: 'resolution_notes required' });
      const actor = {
        actor_id: actor_id || 'human_admin',
        actor_type: 'human' as const,
        performed_via: 'Cockpit UI'
      };
      governanceRepo.resolveConflictCase(id, resolution_notes, actor, 'Resolved via Cockpit UI');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/governance/promote', (req, res) => {
    try {
      const { localEntityId, actor, reason } = req.body;
      const canonical = governanceRepo.promoteToCanonical(localEntityId, actor, reason);
      res.json(canonical);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Ingestion
  app.post('/api/ingestion/start', (req, res) => {
    try {
      const { sourceId, actor, reason } = req.body;
      const run = ingestionRepo.startIngestionRun(sourceId, actor, reason);
      res.json(run);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/ingestion/:id/complete', (req, res) => {
    try {
      const { actor, reason } = req.body;
      ingestionRepo.completeIngestionRun(req.params.id, actor, reason);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Events
  app.get('/api/events', (req, res) => {
    res.json(eventRepo.getEvents());
  });

  app.get('/api/search', (req, res) => {
    console.log('Search query:', req.query);
    try {
      const { q, domain, type, status, limit = '20' } = req.query as any;
      console.log('Search term:', q);

      if (!q || q.length < 2) {
        return res.json({ entities: [], relations: [], events: [] });
      }

      const term = `%${q}%`;
      const lim = parseInt(limit);
      console.log('Term:', term, 'Limit:', lim);

      // Busca entidades por label
      let entityQuery = `
        SELECT le.*, d.name as domain_name
        FROM local_entities le
        LEFT JOIN domains d ON d.id = le.domain_id
        WHERE le.label LIKE ?
      `;
      const entityParams: any[] = [term];
      if (domain) { entityQuery += ' AND le.domain_id = ?'; entityParams.push(domain); }
      if (type) { entityQuery += ' AND le.entity_type = ?'; entityParams.push(type); }
      if (status) { entityQuery += ' AND le.validation_status = ?'; entityParams.push(status); }
      entityQuery += ` LIMIT ${lim}`;
      console.log('Entity Query:', entityQuery, 'Params:', entityParams);

      const entityRows = db.prepare(entityQuery).all(...entityParams);
      console.log('Entities found:', entityRows.length);

      // Busca relações por type
      let relationQuery = `
        SELECT ra.*
        FROM relation_assertions ra
        WHERE ra.relation_type LIKE ?
      `;
      const relationParams: any[] = [term];
      relationQuery += ` LIMIT ${lim}`;
      console.log('Relation Query:', relationQuery, 'Params:', relationParams);
      const relationRows = db.prepare(relationQuery).all(...relationParams);
      console.log('Relations found:', relationRows.length);

      // Busca eventos por reason
      let eventQuery = `
        SELECT te.*
        FROM transformation_events te
        WHERE te.reason LIKE ?
      `;
      const eventParams: any[] = [term];
      eventQuery += ` LIMIT ${lim}`;
      console.log('Event Query:', eventQuery, 'Params:', eventParams);
      const eventRows = db.prepare(eventQuery).all(...eventParams);
      console.log('Events found:', eventRows.length);

      res.json({
        entities: entityRows,
        relations: relationRows,
        events: eventRows,
        total: entityRows.length + relationRows.length + eventRows.length
      });
    } catch (err: any) {
      console.error('Search error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Graph API
  app.get('/api/graph/all', (req, res) => {
    const data = graphRepo.getAllDomainsGraph();
    const links = data.edges.map(e => ({
      ...e,
      source_id: e.source_entity_id,
      target_id: e.target_entity_id
    }));
    res.json({ nodes: data.nodes, links, domainList: data.domainList });
  });

  app.get('/api/graph', (req, res) => {
    try {
      const domainId = req.query.domain_id as string;
      const entityId = req.query.entity_id as string;
      const depth = parseInt(req.query.depth as string) || 2;

      if (!domainId) return res.status(400).json({ error: 'domain_id is required' });

      let graphData;
      if (entityId) {
        graphData = graphRepo.getSubgraph(entityId, depth);
      } else {
        graphData = graphRepo.getDomainGraph(domainId);
      }

      // Transform edges to links for frontend
      const links = graphData.edges.map(e => ({
        ...e,
        source_id: e.source_entity_id,
        target_id: e.target_entity_id
      }));

      const domainList = db.prepare('SELECT id, name, slug FROM domains').all();

      res.json({ nodes: graphData.nodes, links, domainList });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
