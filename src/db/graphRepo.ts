import db from './index.js';
import { LocalEntity, RelationAssertion } from '../types.js';

export interface GraphData {
  nodes: LocalEntity[];
  edges: RelationAssertion[];
}

export const graphRepo = {
  getSubgraph: (entityId: string, depth: number = 2): GraphData => {
    // We use a recursive CTE to find all related entities up to 'depth'
    const stmt = db.prepare(`
      WITH RECURSIVE
      traverse(id, current_depth) AS (
        SELECT ?, 0
        UNION
        SELECT 
          CASE 
            WHEN r.source_entity_id = t.id THEN r.target_entity_id
            ELSE r.source_entity_id
          END,
          t.current_depth + 1
        FROM traverse t
        JOIN relation_assertions r ON r.source_entity_id = t.id OR r.target_entity_id = t.id
        WHERE t.current_depth < ?
      )
      SELECT DISTINCT id FROM traverse;
    `);

    const rows = stmt.all(entityId, depth) as { id: string }[];
    const entityIds = rows.map(r => r.id);

    if (entityIds.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Fetch the local entities
    const placeholders = entityIds.map(() => '?').join(',');
    const nodesStmt = db.prepare(`SELECT * FROM local_entities WHERE id IN (${placeholders})`);
    const nodesRows = nodesStmt.all(...entityIds) as any[];
    const nodes = nodesRows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));

    // Fetch the edges between these entities
    const edgesStmt = db.prepare(`
      SELECT * FROM relation_assertions 
      WHERE source_entity_id IN (${placeholders}) 
        AND target_entity_id IN (${placeholders})
    `);
    const edgesRows = edgesStmt.all(...entityIds, ...entityIds) as any[];
    const edges = edgesRows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));

    return { nodes, edges };
  },

  getDomainGraph: (domainId: string): GraphData => {
    const nodesStmt = db.prepare('SELECT * FROM local_entities WHERE domain_id = ?');
    const nodesRows = nodesStmt.all(domainId) as any[];
    const nodes = nodesRows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));

    const edgesStmt = db.prepare('SELECT * FROM relation_assertions WHERE domain_id = ?');
    const edgesRows = edgesStmt.all(domainId) as any[];
    const edges = edgesRows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));

    return { nodes, edges };
  },

  getAllDomainsGraph: (): GraphData & { domainList: {id:string, name:string, slug:string}[] } => {
    // Todos os nós de todos os domínios
    const nodesRows = db.prepare('SELECT * FROM local_entities').all() as any[];
    const nodes = nodesRows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));

    // Todas as arestas — incluindo cross-domain
    // Uma aresta é cross-domain se source e target têm domain_id diferentes
    const edgesRows = db.prepare('SELECT * FROM relation_assertions').all() as any[];
    const edges = edgesRows.map(row => ({
      ...row,
      attributes: JSON.parse(row.attributes),
      provenance: JSON.parse(row.provenance)
    }));

    // Lista de domínios para o frontend colorir
    const domainList = db.prepare('SELECT id, name, slug FROM domains').all() as {id:string, name:string, slug:string}[];

    return { nodes, edges, domainList };
  }
};
