# Nexus Cockpit - Agent Operational Guide

Este documento serve como o manual de instruções para agentes de IA que operam ou modificam o Nexus Cockpit.

## 1. Arquitetura de Customização

O sistema foi desenhado para ser "AI-First", com pontos de extensão claros e isolados.

### Configuração Centralizada (`src/config/cockpit.config.ts`)
Toda decisão visual ou de comportamento deve ser alterada aqui primeiro.
- **ENTITY_STYLES**: Cores e ícones (SVG paths) por tipo de entidade.
- **PHYSICS_DEFAULTS**: Parâmetros da simulação D3.
- **SYSTEM_HEALTH_RULES**: Lógica de cálculo de saúde do sistema.
- **DECISION_QUEUE_RULES**: Regras de priorização da fila de decisões.

### Hooks de Dados (`src/hooks/`)
Lógica de negócio extraída dos componentes.
- `useNexusEntities`: Filtragem e acesso a entidades.
- `useNexusDelta`: Detecção de mudanças desde a última visita.
- `useDecisionQueue`: Motor de priorização de tarefas.
- `useMutations`: Encapsulamento de chamadas de API com metadados de proveniência.

## 2. Como Estender o Sistema

### Adicionar um Novo Tipo de Entidade
1. Abra `src/config/cockpit.config.ts`.
2. Adicione uma nova entrada em `ENTITY_STYLES` com cor e ícone.
3. O sistema aplicará automaticamente ao grafo e aos formulários.

### Adicionar uma Nova Regra na Fila de Decisões
1. Abra `src/config/cockpit.config.ts`.
2. Adicione um novo objeto em `DECISION_QUEUE_RULES`.
3. Defina a `condition` (função que recebe o store) e a `priority`.

## 3. Contratos de Dados Principais

### Entity
```typescript
interface Entity {
  id: string;
  domain_id: string;
  entity_type: string;
  label: string;
  attributes: Record<string, any>;
  validation_status: 'proposed' | 'validated' | 'rejected' | 'conflict';
  confidence: number;
}
```

### Event (Transformation)
```typescript
interface TransformationEvent {
  id: string;
  domain_id: string;
  event_type: string;
  payload: any;
  actor_id: string;
  actor_type: 'human' | 'agent' | 'system';
  created_at: string;
}
```

## 4. Áreas Imutáveis
Não altere os seguintes arquivos sem uma diretriz explícita do Arquiteto:
- `server.ts` (Backend Core)
- `repository.ts` (Data Access)
- `schema.sql` (Database Structure)
- `src/store/index.ts` (State Management Core)

## 5. Protocolo de Mudança Segura
1. **Identifique** o parâmetro em `cockpit.config.ts`.
2. **Verifique** se há um hook em `src/hooks/` que já provê os dados necessários.
3. **Modifique** o componente visual apenas se a lógica de dados já estiver resolvida.
4. **Valide** usando `lint_applet` e `compile_applet`.
