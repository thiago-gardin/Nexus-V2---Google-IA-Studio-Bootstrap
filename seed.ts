import { domainRepo, sourceRepo, entityRepo, relationRepo } from './src/db/repository.js';
import { db } from './src/db/index.js';
import { Provenance } from './src/types.js';

async function seed() {
  const actor: Provenance = { actor_id: 'agent_nexus', actor_type: 'agent', performed_via: 'CLI Seed Script' };
  const reason = 'Initial seed for project management domain';

  console.log('Cleaning up existing data...');
  db.transaction(() => {
    db.prepare('DELETE FROM conflict_cases').run();
    db.prepare('DELETE FROM governance_rules').run();
    db.prepare('DELETE FROM transformation_events').run();
    db.prepare('DELETE FROM ingestion_runs').run();
    db.prepare('DELETE FROM relation_assertions').run();
    db.prepare('DELETE FROM local_entities').run();
    db.prepare('DELETE FROM canonical_entities').run();
    db.prepare('DELETE FROM sources').run();
    db.prepare('DELETE FROM domain_versions').run();
    db.prepare('DELETE FROM domains').run();
  })();

  console.log('Creating domain...');
  const domain = domainRepo.createDomain({
    name: 'Project Management Seed',
    slug: 'proj-mgmt-seed',
    description: 'Domain for managing projects and stakeholders (Seed)',
    status: 'active',
    provenance: actor,
    confidence: 1.0,
    validation_status: 'validated'
  }, reason);

  console.log('Creating domain version...');
  const version = domainRepo.createDomainVersion({
    domain_id: domain.id,
    version_number: 1,
    charter_text: 'Charter for Project Management domain',
    schema_json: {
      allowed_entity_types: ['Project', 'Stakeholder'],
      allowed_relation_types: ['MANAGES', 'PARTICIPATES_IN'],
      required_fields_by_type: {
        'Project': ['name', 'deadline'],
        'Stakeholder': ['name', 'role']
      }
    },
    status: 'draft',
    provenance: actor,
    confidence: 1.0,
    validation_status: 'validated'
  }, reason);

  console.log('Activating domain version...');
  domainRepo.activateDomainVersion(version.id, actor, reason);

  console.log('Creating source...');
  const source = sourceRepo.createSource({
    uri: 'nexus://seed-data',
    type: 'agent',
    metadata: { description: 'Seed data source' },
    provenance: actor,
    confidence: 1.0,
    validation_status: 'validated'
  }, reason);

  const projects = [];
  for (let i = 1; i <= 3; i++) {
    console.log(`Creating project ${i}...`);
    const project = entityRepo.createLocalEntity({
      domain_id: domain.id,
      source_id: source.id,
      entity_type: 'Project',
      label: `Project ${String.fromCharCode(64 + i)}`,
      attributes: { name: `Project ${String.fromCharCode(64 + i)}`, deadline: `2026-12-31` },
      provenance: actor,
      confidence: 1.0,
      validation_status: 'validated'
    }, reason);
    projects.push(project);
  }

  const stakeholders = [];
  const roles = ['Manager', 'Developer', 'Designer', 'QA', 'Product Owner'];
  for (let i = 1; i <= 10; i++) {
    console.log(`Creating stakeholder ${i}...`);
    const stakeholder = entityRepo.createLocalEntity({
      domain_id: domain.id,
      source_id: source.id,
      entity_type: 'Stakeholder',
      label: `Stakeholder ${i.toString().padStart(2, '0')}`,
      attributes: { name: `Stakeholder ${i}`, role: roles[i % roles.length] },
      provenance: actor,
      confidence: 1.0,
      validation_status: 'validated'
    }, reason);
    stakeholders.push(stakeholder);
  }

  console.log('Creating relations...');
  for (let i = 0; i < 10; i++) {
    const projectIndex = i % 3;
    relationRepo.createRelationAssertion({
      domain_id: domain.id,
      source_id: source.id,
      source_entity_id: stakeholders[i].id,
      target_entity_id: projects[projectIndex].id,
      relation_type: i < 3 ? 'MANAGES' : 'PARTICIPATES_IN',
      directionality: i % 2 === 0 ? 'directed' : 'bidirectional',
      attributes: { since: '2026-01-01' },
      provenance: actor,
      confidence: 1.0,
      validation_status: 'validated'
    }, reason);
  }

  console.log('Seed completed successfully!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
