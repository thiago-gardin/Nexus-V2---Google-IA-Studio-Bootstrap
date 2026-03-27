import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { 
  domainRepo, 
  entityRepo, 
  relationRepo, 
  governanceRepo, 
  eventRepo 
} from "../db/repository.js";
import { Provenance } from "../types.js";

const server = new Server(
  {
    name: "nexus-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_domains",
        description: "List all domains",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_entity",
        description: "Get a specific entity by ID",
        inputSchema: {
          type: "object",
          properties: {
            entity_id: { type: "string" },
          },
          required: ["entity_id"],
        },
      },
      {
        name: "list_entities",
        description: "List entities with optional filtering",
        inputSchema: {
          type: "object",
          properties: {
            domain_id: { type: "string" },
            entity_type: { type: "string" },
          },
        },
      },
      {
        name: "list_relations",
        description: "List relations with optional filtering",
        inputSchema: {
          type: "object",
          properties: {
            domain_id: { type: "string" },
          },
        },
      },
      {
        name: "create_local_entity",
        description: "Create a new local entity",
        inputSchema: {
          type: "object",
          properties: {
            domain_id: { type: "string" },
            entity_type: { type: "string" },
            label: { type: "string" },
            attributes: { type: "object" },
            actor_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["domain_id", "entity_type", "label", "attributes", "actor_id", "reason"],
        },
      },
      {
        name: "create_relation_assertion",
        description: "Create a new relation assertion",
        inputSchema: {
          type: "object",
          properties: {
            domain_id: { type: "string" },
            source_id: { type: "string" },
            target_id: { type: "string" },
            relation_type: { type: "string" },
            directionality: { type: "string", enum: ["directed", "bidirectional"] },
            actor_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["domain_id", "source_id", "target_id", "relation_type", "directionality", "actor_id", "reason"],
        },
      },
      {
        name: "validate_object",
        description: "Validate an object",
        inputSchema: {
          type: "object",
          properties: {
            object_type: { type: "string" },
            object_id: { type: "string" },
            actor_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["object_type", "object_id", "actor_id", "reason"],
        },
      },
      {
        name: "reject_object",
        description: "Reject an object",
        inputSchema: {
          type: "object",
          properties: {
            object_type: { type: "string" },
            object_id: { type: "string" },
            actor_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["object_type", "object_id", "actor_id", "reason"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_domains": {
        return { content: [{ type: "text", text: JSON.stringify(domainRepo.getDomains()) }] };
      }
      case "get_entity": {
        const { entity_id } = args as { entity_id: string };
        const entity = entityRepo.getLocalEntity(entity_id);
        if (!entity) return { content: [{ type: "text", text: "Entity not found" }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(entity) }] };
      }
      case "list_entities": {
        const { domain_id, entity_type } = args as { domain_id?: string; entity_type?: string };
        let entities = entityRepo.getLocalEntities();
        if (domain_id) entities = entities.filter(e => e.domain_id === domain_id);
        if (entity_type) entities = entities.filter(e => e.entity_type === entity_type);
        return { content: [{ type: "text", text: JSON.stringify(entities) }] };
      }
      case "list_relations": {
        const { domain_id } = args as { domain_id?: string };
        let relations = relationRepo.getRelationAssertions();
        if (domain_id) relations = relations.filter(r => r.domain_id === domain_id);
        return { content: [{ type: "text", text: JSON.stringify(relations) }] };
      }
      case "create_local_entity": {
        const { domain_id, entity_type, label, attributes, actor_id, reason } = args as any;
        const provenance: Provenance = { actor_id, actor_type: 'agent', performed_via: 'MCP' };
        
        try {
          const entity = entityRepo.createLocalEntity({
            domain_id,
            entity_type,
            label,
            attributes,
            provenance,
            confidence: 1.0,
            validation_status: 'proposed'
          }, reason);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                affected_ids: [entity.id],
                events_generated: 1,
                warnings: []
              })
            }]
          };
        } catch (err: any) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                violation_detail: err.message
              })
            }],
            isError: true
          };
        }
      }
      case "create_relation_assertion": {
        const { domain_id, source_id, target_id, relation_type, directionality, actor_id, reason } = args as any;
        const provenance: Provenance = { actor_id, actor_type: 'agent', performed_via: 'MCP' };
        
        try {
          const relation = relationRepo.createRelationAssertion({
            domain_id,
            source_id, // Wait, relationRepo.createRelationAssertion expects source_id? Let's check.
            source_entity_id: source_id,
            target_entity_id: target_id,
            relation_type,
            directionality,
            attributes: {},
            provenance,
            confidence: 1.0,
            validation_status: 'proposed'
          }, reason);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                affected_ids: [relation.id],
                events_generated: 1,
                warnings: []
              })
            }]
          };
        } catch (err: any) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                violation_detail: err.message
              })
            }],
            isError: true
          };
        }
      }
      case "validate_object": {
        const { object_type, object_id, actor_id, reason } = args as any;
        const provenance: Provenance = { actor_id, actor_type: 'agent', performed_via: 'MCP' };
        
        try {
          governanceRepo.validateObject(object_type, object_id, provenance, reason);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                affected_ids: [object_id],
                events_generated: 1,
                warnings: []
              })
            }]
          };
        } catch (err: any) {
          return { content: [{ type: "text", text: err.message }], isError: true };
        }
      }
      case "reject_object": {
        const { object_type, object_id, actor_id, reason } = args as any;
        const provenance: Provenance = { actor_id, actor_type: 'agent', performed_via: 'MCP' };
        
        try {
          governanceRepo.rejectObject(object_type, object_id, provenance, reason);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                affected_ids: [object_id],
                events_generated: 1,
                warnings: []
              })
            }]
          };
        } catch (err: any) {
          return { content: [{ type: "text", text: err.message }], isError: true };
        }
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nexus MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
