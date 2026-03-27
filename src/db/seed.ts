import db from './index.js';
import { 
  domainRepo, sourceRepo, entityRepo, relationRepo, governanceRepo 
} from './repository.js';
import { Provenance } from '../types.js';

const seedActor: Provenance = {
  actor_id: 'seed-script',
  actor_type: 'system',
  performed_via: 'manual-seed'
};

async function seed() {
  console.log('Starting seed process...');

  // 1. CLEANUP (Reverse order of FK)
  console.log('Cleaning up existing data...');
  db.transaction(() => {
    db.prepare('DELETE FROM transformation_events').run();
    db.prepare('DELETE FROM relation_assertions').run();
    db.prepare('DELETE FROM canonical_entities').run();
    db.prepare('DELETE FROM local_entities').run();
    db.prepare('DELETE FROM ingestion_runs').run();
    db.prepare('DELETE FROM conflict_cases').run();
    db.prepare('DELETE FROM governance_rules').run();
    db.prepare('DELETE FROM sources').run();
    db.prepare('DELETE FROM domain_versions').run();
    db.prepare('DELETE FROM domains').run();
  })();

  // 2. DOMAINS & SOURCES
  console.log('Creating domains and sources...');

  // Domain 1: Projects Governance
  const domProjects = domainRepo.createDomain({
    name: 'Projects & Governance',
    slug: 'projects-governance',
    description: 'Management of academic and professional projects, milestones, and governance rules.',
    status: 'active',
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Initial seed');

  domainRepo.createDomainVersion({
    domain_id: domProjects.id,
    version_number: 1,
    charter_text: 'Charter for Projects & Governance domain. Focuses on project lifecycle and academic governance.',
    schema_json: {
      allowed_entity_types: ['Project', 'Task', 'Decision', 'Risk', 'Artifact'],
      allowed_relation_types: ['PART_OF', 'DEPENDS_ON', 'MITIGATES', 'PRODUCED_BY', 'GOVERNS'],
      required_fields_by_type: {
        'Project': ['title', 'status'],
        'Task': ['title', 'status'],
        'Decision': ['title', 'date']
      }
    },
    status: 'active',
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Initial charter');

  const srcProjects = sourceRepo.createSource({
    uri: 'manual://seed-projects',
    type: 'manual',
    metadata: { description: 'Manual seed data for projects' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Seed source');

  // Domain 2: Email Communications
  const domEmail = domainRepo.createDomain({
    name: 'Email Communications',
    slug: 'email-communications',
    description: 'Ingested email threads and messages from academic and professional accounts.',
    status: 'active',
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Initial seed');

  domainRepo.createDomainVersion({
    domain_id: domEmail.id,
    version_number: 1,
    charter_text: 'Charter for Email Communications. Focuses on communication patterns and information extraction.',
    schema_json: {
      allowed_entity_types: ['EmailThread', 'EmailMessage', 'EmailParticipant', 'Attachment', 'ActionCandidate', 'TopicCandidate'],
      allowed_relation_types: ['CONTAINS', 'SENT_BY', 'RECEIVED_BY', 'REPLIES_TO', 'MENTIONS', 'ATTACHED_TO'],
      required_fields_by_type: {
        'EmailThread': ['subject'],
        'EmailMessage': ['subject', 'sent_at'],
        'EmailParticipant': ['email']
      }
    },
    status: 'active',
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Initial charter');

  const srcEmail = sourceRepo.createSource({
    uri: 'pst://simulated-inbox-2026',
    type: 'document',
    metadata: { account: 'thiago.gardin@fgv.edu.br' },
    provenance: seedActor,
    confidence: 0.95,
    validation_status: 'validated'
  }, 'Seed source');

  // Domain 3: People Network
  const domPeople = domainRepo.createDomain({
    name: 'People & Network',
    slug: 'people-network',
    description: 'Social and professional network of contacts and organizations.',
    status: 'active',
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Initial seed');

  domainRepo.createDomainVersion({
    domain_id: domPeople.id,
    version_number: 1,
    charter_text: 'Charter for People & Network. Focuses on relationships and institutional affiliations.',
    schema_json: {
      allowed_entity_types: ['Person', 'Organization', 'Relationship', 'ContactPoint'],
      allowed_relation_types: ['WORKS_FOR', 'MEMBER_OF', 'REPORTS_TO', 'KNOWS', 'EQUIVALENT_TO'],
      required_fields_by_type: {
        'Person': ['name'],
        'Organization': ['name']
      }
    },
    status: 'active',
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Initial charter');

  const srcPeople = sourceRepo.createSource({
    uri: 'manual://people-seed',
    type: 'manual',
    metadata: { description: 'Manual seed data for people' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Seed source');

  // 3. ENTITIES
  console.log('Populating entities...');

  // --- Projects Governance ---
  const entPhD = entityRepo.createLocalEntity({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    entity_type: 'Project',
    label: 'Doutorado FGV/EPPG',
    attributes: { title: 'Doutorado em Administração Pública e Governo', status: 'active', university: 'FGV/EPPG', focus: 'Governance & AI' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'PhD Project');

  const entUTM = entityRepo.createLocalEntity({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    entity_type: 'Project',
    label: 'Sanduíche UTM (Toronto)',
    attributes: { title: 'Visiting PhD Student at University of Toronto Mississauga', status: 'active', location: 'Toronto, Canada' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Exchange Project');

  const entOBP = entityRepo.createLocalEntity({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    entity_type: 'Project',
    label: 'OBP 2026',
    attributes: { title: 'Olimpíada Brasileira de Políticas Públicas 2026', status: 'planning', role: 'Coordinator' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'OBP Project');

  const entNexus = entityRepo.createLocalEntity({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    entity_type: 'Project',
    label: 'Nexus Alpha',
    attributes: { title: 'Nexus Cognitive Infrastructure Development', status: 'active', phase: 'Alpha' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Nexus Project');

  const entReturnBSB = entityRepo.createLocalEntity({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    entity_type: 'Task',
    label: 'Retorno para Brasília',
    attributes: { title: 'Logística de retorno ao Brasil', status: 'pending', deadline: '2026-04-15' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Return Task');

  // --- Email Communications ---
  const entThreadOBP = entityRepo.createLocalEntity({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    entity_type: 'EmailThread',
    label: 'Thread: OBP 2026 Planning',
    attributes: { subject: 'OBP 2026: Cronograma e Parcerias', last_activity: '2026-03-20' },
    provenance: seedActor,
    confidence: 0.9,
    validation_status: 'validated'
  }, 'Email Thread');

  const entMsgOBP1 = entityRepo.createLocalEntity({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    entity_type: 'EmailMessage',
    label: 'Email: Parceria Enap',
    attributes: { subject: 'Re: OBP 2026: Cronograma e Parcerias', sent_at: '2026-03-20T14:30:00Z', from: 'thiago.gardin@fgv.edu.br', body_snippet: 'Precisamos validar o termo de cooperação com a Enap...' },
    provenance: seedActor,
    confidence: 0.95,
    validation_status: 'validated'
  }, 'Email Message');

  const entParticipantThiago = entityRepo.createLocalEntity({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    entity_type: 'EmailParticipant',
    label: 'Thiago Gardin (Email)',
    attributes: { email: 'thiago.gardin@fgv.edu.br', name: 'Thiago Gardin' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Email Participant');

  const entParticipantMatthew = entityRepo.createLocalEntity({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    entity_type: 'EmailParticipant',
    label: 'Matthew Adams (Email)',
    attributes: { email: 'matthew.adams@utoronto.ca', name: 'Matthew Adams' },
    provenance: seedActor,
    confidence: 0.9,
    validation_status: 'validated'
  }, 'Email Participant');

  const entAttachmentOBP = entityRepo.createLocalEntity({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    entity_type: 'Attachment',
    label: 'obp_2026_proposal.pdf',
    attributes: { filename: 'obp_2026_proposal.pdf', size: 1024000, mime_type: 'application/pdf' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Email Attachment');

  // --- People Network ---
  const entPersonThiago = entityRepo.createLocalEntity({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    entity_type: 'Person',
    label: 'Thiago Gardin',
    attributes: { name: 'Thiago Gardin', role: 'PhD Candidate', bio: 'Doutorando em Administração Pública e Governo na FGV/EAESP.' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated',
    canonical_candidate_flag: true
  }, 'Person Entity');

  const entPersonMatthew = entityRepo.createLocalEntity({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    entity_type: 'Person',
    label: 'Matthew Adams',
    attributes: { name: 'Matthew Adams', title: 'Professor', university: 'University of Toronto' },
    provenance: seedActor,
    confidence: 0.85,
    validation_status: 'proposed',
    canonical_candidate_flag: true
  }, 'Person Entity');

  const entOrgFGV = entityRepo.createLocalEntity({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    entity_type: 'Organization',
    label: 'FGV',
    attributes: { name: 'Fundação Getulio Vargas', acronym: 'FGV', country: 'Brazil' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Organization Entity');

  const entOrgUTM = entityRepo.createLocalEntity({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    entity_type: 'Organization',
    label: 'UTM',
    attributes: { name: 'University of Toronto Mississauga', acronym: 'UTM', country: 'Canada' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Organization Entity');

  // 4. RELATIONS
  console.log('Creating relations...');

  // --- Intra-domain: Projects ---
  relationRepo.createRelationAssertion({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    source_entity_id: entUTM.id,
    target_entity_id: entPhD.id,
    relation_type: 'PART_OF',
    directionality: 'directed',
    attributes: { context: 'PhD Exchange Program' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'PhD Relation');

  relationRepo.createRelationAssertion({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    source_entity_id: entReturnBSB.id,
    target_entity_id: entUTM.id,
    relation_type: 'DEPENDS_ON',
    directionality: 'directed',
    attributes: { reason: 'End of exchange period' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Task Dependency');

  // --- Intra-domain: Email ---
  relationRepo.createRelationAssertion({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    source_entity_id: entThreadOBP.id,
    target_entity_id: entMsgOBP1.id,
    relation_type: 'CONTAINS',
    directionality: 'directed',
    attributes: {},
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Thread Content');

  relationRepo.createRelationAssertion({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    source_entity_id: entMsgOBP1.id,
    target_entity_id: entParticipantThiago.id,
    relation_type: 'SENT_BY',
    directionality: 'directed',
    attributes: {},
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Email Sender');

  relationRepo.createRelationAssertion({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    source_entity_id: entMsgOBP1.id,
    target_entity_id: entAttachmentOBP.id,
    relation_type: 'ATTACHED_TO',
    directionality: 'directed',
    attributes: {},
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Email Attachment');

  // --- Intra-domain: People ---
  relationRepo.createRelationAssertion({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    source_entity_id: entPersonThiago.id,
    target_entity_id: entOrgFGV.id,
    relation_type: 'MEMBER_OF',
    directionality: 'directed',
    attributes: { role: 'PhD Student' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Affiliation');

  relationRepo.createRelationAssertion({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    source_entity_id: entPersonMatthew.id,
    target_entity_id: entOrgUTM.id,
    relation_type: 'WORKS_FOR',
    directionality: 'directed',
    attributes: { position: 'Professor' },
    provenance: seedActor,
    confidence: 1.0,
    validation_status: 'validated'
  }, 'Employment');

  relationRepo.createRelationAssertion({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    source_entity_id: entPersonThiago.id,
    target_entity_id: entPersonMatthew.id,
    relation_type: 'KNOWS',
    directionality: 'bidirectional',
    attributes: { context: 'Academic Supervision at UTM' },
    provenance: seedActor,
    confidence: 0.9,
    validation_status: 'validated'
  }, 'Acquaintance');

  // --- CROSS-DOMAIN RELATIONS ---
  console.log('Creating cross-domain relations...');

  // Email Thread -> Project (Emergent relation)
  relationRepo.createRelationAssertion({
    domain_id: domEmail.id,
    source_id: srcEmail.id,
    source_entity_id: entThreadOBP.id,
    target_entity_id: entOBP.id,
    relation_type: 'DISCUSSES_PROJECT',
    directionality: 'directed',
    attributes: { confidence_note: 'Inferred from subject keywords' },
    provenance: seedActor,
    confidence: 0.85,
    validation_status: 'proposed'
  }, 'Cross-domain link');

  // Email Participant -> Person (Identity link)
  relationRepo.createRelationAssertion({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    source_entity_id: entParticipantThiago.id,
    target_entity_id: entPersonThiago.id,
    relation_type: 'EQUIVALENT_TO',
    directionality: 'bidirectional',
    attributes: { logic: 'Email match' },
    provenance: seedActor,
    confidence: 0.99,
    validation_status: 'proposed'
  }, 'Identity resolution');

  relationRepo.createRelationAssertion({
    domain_id: domPeople.id,
    source_id: srcPeople.id,
    source_entity_id: entParticipantMatthew.id,
    target_entity_id: entPersonMatthew.id,
    relation_type: 'EQUIVALENT_TO',
    directionality: 'bidirectional',
    attributes: { logic: 'Name and affiliation match' },
    provenance: seedActor,
    confidence: 0.8,
    validation_status: 'proposed'
  }, 'Identity resolution');

  // Attachment -> Artifact (Emergent relation)
  relationRepo.createRelationAssertion({
    domain_id: domProjects.id,
    source_id: srcProjects.id,
    source_entity_id: entAttachmentOBP.id,
    target_entity_id: entOBP.id,
    relation_type: 'PROPOSAL_FOR',
    directionality: 'directed',
    attributes: {},
    provenance: seedActor,
    confidence: 0.9,
    validation_status: 'proposed'
  }, 'Cross-domain link');

  // 5. CONFLICT CASE
  console.log('Creating conflict case...');
  governanceRepo.openConflictCase({
    domain_id: domEmail.id,
    target_object_id: entParticipantMatthew.id,
    target_object_type: 'LocalEntity',
    conflict_type: 'DUPLICATE_IDENTITY',
    description: 'Potential duplicate between EmailParticipant and Person entity. Matthew Adams has multiple email aliases detected.',
    status: 'open',
    provenance: seedActor,
    confidence: 0.7,
    validation_status: 'proposed'
  }, 'Identity conflict detected');

  // 6. FINAL LOGS
  console.log('\nSeed completed successfully!');
  const domains = db.prepare('SELECT id, slug FROM domains').all() as any[];
  for (const d of domains) {
    const entCount = db.prepare('SELECT COUNT(*) as count FROM local_entities WHERE domain_id = ?').get(d.id) as any;
    const relCount = db.prepare('SELECT COUNT(*) as count FROM relation_assertions WHERE domain_id = ?').get(d.id) as any;
    console.log(`Domain [${d.slug}]: ${entCount.count} entities, ${relCount.count} relations.`);
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
