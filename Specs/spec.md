# Nexus — Especificação Funcional Completa

Versão: 0.1
Status: referência de arquitetura funcional para o repositório
Escopo: core do Nexus (estrutura de dados + cockpit + MCP) + dois módulos de domínio prontos para ingestão inicial
Módulos incluídos: Governança de Projetos e E-mail (Outlook PST)

## 1. Finalidade

O Nexus é uma infraestrutura cognitiva operacional orientada por domínios. Sua função é transformar fontes informacionais heterogêneas em memória relacional explícita, auditável, versionada e operável por humanos e agentes sob paridade funcional.

Esta especificação define o comportamento funcional mínimo de um Nexus completo, suficiente para orientar implementação de produção incremental sem perder a tese estrutural do sistema.

## 2. Princípios funcionais inegociáveis

### 2.1 Domínio como unidade básica

Todo conteúdo persistido no Nexus deve nascer em um domínio. Não existe entidade “solta” fora de um domínio de origem.

### 2.2 Núcleo fino obrigatório

Todo objeto persistente do Nexus deve carregar, no mínimo:

* identidade do objeto
* tipo do objeto
* identidade do domínio
* proveniência
* timestamp de criação
* timestamp de atualização
* confiança
* versão
* status de validação

### 2.3 Relações como asserções revisáveis

Relações não são tratadas como verdades ontológicas definitivas. São asserções com evidência, confiança, estado de validação e histórico.

### 2.4 Simetria humano-agente

Toda operação crítica disponível ao agente deve ser inspecionável, reconstruível e funcionalmente reproduzível por operador humano qualificado, ainda que por interface distinta.

### 2.5 Governança explícita

Promoção de entidades, fusões, equivalências, conflitos e mudanças de regra devem ser registradas como eventos institucionais do sistema.

### 2.6 Separação entre substrato e superfícies

O Nexus não se confunde com cockpit, MCP, CLI, API ou interface gráfica. O substrato persiste os objetos e eventos; as superfícies apenas operam sobre ele.

## 3. Escopo funcional desta versão

Esta versão cobre:

* core de dados do Nexus
* runtime funcional do substrato
* cockpit humano
* superfície agentiva via MCP
* módulo de domínio de Governança de Projetos
* módulo de domínio de E-mail com ingestão inicial de arquivo PST
* pipelines de ingestão, validação, reconciliação e auditoria

Esta versão não cobre:

* busca vetorial avançada como requisito central
* inferência automática de alta autonomia sem revisão humana
* execução distribuída multiusuário complexa
* grafo visual avançado como requisito bloqueante
* canonicidade automática baseada apenas em heurística opaca

## 4. Macroarquitetura funcional

O Nexus completo deve ser organizado em cinco camadas funcionais.

### 4.1 Substrato

Camada persistente do sistema. Responsável por:

* armazenar domínios, cartas de domínio, fontes, entidades, relações, eventos e regras
* garantir versionamento
* garantir integridade referencial
* expor operações transacionais
* registrar trilha de auditoria

### 4.2 Runtime

Camada de execução do núcleo. Responsável por:

* aplicar regras de domínio
* orquestrar ingestão
* validar mutações
* disparar eventos
* resolver políticas de promoção e reconciliação

### 4.3 Superfície humana (cockpit)

Camada operacional para humanos. Responsável por:

* navegação por domínios, entidades, relações e eventos
* inspeção de proveniência e conflitos
* criação e revisão de mutações
* operação de ingestões
* aprovação ou rejeição de propostas

### 4.4 Superfície agentiva (MCP)

Camada operacional para agentes. Responsável por:

* consulta estruturada ao substrato
* proposição de mutações controladas
* execução de pipelines autorizados
* leitura de cartas de domínio e regras vigentes
* operação auditável em equivalência funcional com humanos

### 4.5 Módulos de domínio

Camadas especializadas que definem:

* carta de domínio
* tipos locais
* tipos relacionais
* fontes suportadas
* regras de ingestão
* critérios de promoção
* políticas de reconciliação

## 5. Objetos fundamentais do Nexus

## 5.1 Domain

Representa uma unidade institucional de interpretação.

Campos obrigatórios:

* domain_id
* slug
* status
* current_version_id
* created_at
* updated_at

Campos funcionais:

* name
* short_description
* cognitive_purpose
* owner_human
* owner_agent
* ingestion_status
* interoperability_level

Status permitidos:

* draft
* active
* suspended
* archived

Operações mínimas:

* criar domínio
* ativar domínio
* suspender domínio
* arquivar domínio
* definir versão vigente da carta
* listar entidades do domínio
* listar relações do domínio
* listar fontes conectadas ao domínio

## 5.2 Domain Version (Carta de Domínio versionada)

Representa a constituição operacional de um domínio em uma versão específica.

Campos obrigatórios:

* domain_version_id
* domain_id
* version_no
* charter_markdown
* schema_json
* created_by
* created_at
* change_reason
* is_active

Conteúdo mínimo da carta:

* propósito cognitivo
* escopo do domínio
* fontes suportadas
* tipos de entidade local
* tipos de relação local
* regras de ingestão
* regras de promoção a entidade canônica
* regras de reconciliação
* dependências de governança
* critérios de qualidade e validação
* campos obrigatórios por tipo
* eventos relevantes do domínio

Operações mínimas:

* criar nova versão
* comparar versões
* ativar nova versão
* marcar versão como superseded
* consultar histórico de mudanças

## 5.3 Source

Representa uma fonte informacional registrada no Nexus.

Campos obrigatórios:

* source_id
* domain_id
* source_type
* source_label
* source_locator
* ingestion_mode
* provenance
* created_at
* updated_at

Tipos mínimos suportados nesta versão:

* file_pst
* email_message
* markdown_file
* json_file
* manual_entry
* api_result

Operações mínimas:

* registrar fonte
* executar ingestão
* reexecutar ingestão
* invalidar fonte
* anexar evidência
* listar objetos gerados pela fonte

## 5.4 Local Entity

Representa um objeto persistido localmente em um domínio.

Campos obrigatórios:

* local_entity_id
* domain_id
* governed_by_domain_version_id
* entity_type
* label
* attributes
* provenance
* confidence
* validation_status
* version
* created_at
* updated_at

Campos funcionais:

* description
* source_evidence_refs
* canonical_candidate_flag
* lifecycle_status
* tags

Status mínimos:

* proposed
* validated
* rejected
* contested
* deprecated

Operações mínimas:

* criar entidade local
* editar entidade local
* validar entidade local
* rejeitar entidade local
* marcar candidata à canonicidade
* vincular evidência
* consultar histórico

## 5.5 Canonical Entity

Representa uma estabilização interdomínio.

Campos obrigatórios:

* canonical_entity_id
* canonical_type
* label
* summary
* backing_local_entities
* confidence
* validation_status
* version
* created_at
* updated_at

Operações mínimas:

* promover entidade local para canônica
* fundir entidades canônicas
* separar entidade canônica
* vincular equivalências
* revisar backing set

## 5.6 Relation Assertion

Representa uma relação explícita e auditável.

Campos obrigatórios:

* assertion_id
* domain_id
* governed_by_domain_version_id
* source_entity_ref
* target_entity_ref
* relation_type
* directionality
* evidence_refs
* provenance
* confidence
* validation_status
* version
* created_at
* updated_at

Operações mínimas:

* criar relação
* editar relação
* validar relação
* rejeitar relação
* anexar evidência
* mudar confiança
* consultar histórico

## 5.7 Transformation Event

Representa toda mutação relevante do sistema.

Campos obrigatórios:

* event_id
* event_type
* target_object_type
* target_object_id
* performed_by
* performed_via
* reason
* timestamp
* reversible_flag

Campos funcionais:

* before_state_ref
* after_state_ref
* related_source_id
* domain_id
* batch_id
* execution_trace

Tipos mínimos de evento:

* DOMAIN_CREATED
* DOMAIN_VERSION_CREATED
* DOMAIN_VERSION_ACTIVATED
* SOURCE_REGISTERED
* INGESTION_STARTED
* INGESTION_COMPLETED
* LOCAL_ENTITY_CREATED
* LOCAL_ENTITY_UPDATED
* RELATION_CREATED
* RELATION_UPDATED
* OBJECT_VALIDATED
* OBJECT_REJECTED
* CANONICAL_PROMOTED
* ENTITY_MERGED
* ENTITY_SPLIT
* RULE_CHANGED
* CONFLICT_OPENED
* CONFLICT_RESOLVED

## 5.8 Governance Rule

Representa regra persistente e versionável que interfere em ingestão, validação, promoção ou reconciliação.

Campos obrigatórios:

* rule_id
* domain_id
* governed_by_domain_version_id
* rule_type
* rule_name
* rule_definition
* status
* created_at
* updated_at
* version

Tipos mínimos:

* ingestion_rule
* validation_rule
* promotion_rule
* reconciliation_rule
* conflict_rule
* retention_rule

## 6. Estrutura relacional mínima do banco

O schema mínimo do core deve conter, no mínimo, as seguintes tabelas ou coleções equivalentes:

* domains
* domain_versions
* sources
* local_entities
* canonical_entities
* relation_assertions
* transformation_events
* governance_rules
* evidence_links
* conflict_cases
* ingestion_runs

### 6.1 Requisitos de integridade

* toda entidade local referencia um domínio
* toda relação referencia um domínio e a versão da carta vigente no momento da criação
* todo evento referencia alvo e autor
* toda promoção para canônica referencia entidades locais de suporte
* toda evidência deve apontar para uma fonte ou trecho de fonte
* nenhuma mutação crítica ocorre sem evento correspondente

## 7. Fluxos operacionais centrais

## 7.1 Fluxo de criação de domínio

1. Operador cria Domain em estado draft.
2. Operador cria primeira Domain Version com carta completa.
3. Runtime valida consistência mínima da carta.
4. Operador ativa a versão.
5. Evento DOMAIN_CREATED e DOMAIN_VERSION_ACTIVATED são registrados.
6. Domínio passa a aceitar ingestões.

## 7.2 Fluxo de ingestão genérica

1. Fonte é registrada em Source.
2. Ingestion Run é iniciado.
3. Adaptador de fonte extrai unidades brutas.
4. Parser do domínio tipifica unidades em entidades locais e relações propostas.
5. Regras do domínio validam campos obrigatórios.
6. Objetos persistem com status proposed ou validated conforme política.
7. Eventos de ingestão e criação são registrados.
8. Relatório de ingestão fica disponível no cockpit e via MCP.

## 7.3 Fluxo de validação

1. Humano ou agente qualificado inspeciona objeto.
2. Evidência e carta de domínio vigente são exibidas.
3. Operador valida, rejeita ou contesta.
4. Transformation Event é registrado.
5. Confiança e status são atualizados.

## 7.4 Fluxo de promoção para canônico

1. Regra ou operador sinaliza conjunto recorrente de entidades locais.
2. Caso de promoção é aberto.
3. Evidências e colisões são inspecionadas.
4. Operador aprova promoção.
5. Canonical Entity é criada.
6. Relações de backing são persistidas.
7. Evento CANONICAL_PROMOTED é registrado.

## 7.5 Fluxo de revisão de carta de domínio

1. Nova Domain Version é criada.
2. Diferença em relação à versão ativa é calculada.
3. Impacto potencial sobre entidades, relações e regras é exibido.
4. Operador ativa a nova versão.
5. Objetos futuros passam a referenciar a nova versão.
6. Se necessário, jobs de migração ou reclassificação são abertos.

## 8. Cockpit humano — requisitos funcionais

O cockpit é a superfície operacional humana do Nexus. Ele deve ser suficiente para operar o sistema sem dependência de terminal ou acesso direto ao banco para tarefas ordinárias.

## 8.1 Áreas mínimas do cockpit

### A. Visão geral do sistema

Deve mostrar:

* total de domínios
* domínios ativos
* ingestões recentes
* conflitos abertos
* eventos recentes
* alertas de integridade

### B. Explorer de domínios

Deve permitir:

* listar domínios
* filtrar por status
* abrir carta vigente
* comparar versões
* ver tipos e regras do domínio
* iniciar ingestão por domínio

### C. Explorer de entidades

Deve permitir:

* listar entidades locais e canônicas
* filtrar por domínio, tipo, status, confiança
* abrir atributos, evidência e histórico
* abrir relações incidentes
* abrir backing set

### D. Explorer de relações

Deve permitir:

* listar asserções relacionais
* filtrar por tipo, validação, confiança e domínio
* abrir evidências e histórico
* validar ou rejeitar

### E. Audit trail

Deve permitir:

* navegar por Transformation Events
* filtrar por domínio, ator, período, tipo de evento e alvo
* reconstruir sequência de mutações

### F. Ingestion console

Deve permitir:

* registrar fonte
* subir arquivo
* executar ingestão
* reprocessar
* ver logs e métricas
* ver objetos gerados por run

### G. Governance console

Deve permitir:

* abrir conflitos
* revisar propostas de promoção
* revisar equivalências e fusões
* editar regras autorizadas
* ativar nova versão de carta

### H. Graph / relation view

Deve permitir, no mínimo:

* visualizar subgrafo de uma entidade ou domínio
* filtrar por tipo de relação e profundidade
* clicar em nós para inspeção
* abrir evidência e evento associado

## 8.2 Operações mínimas disponíveis no cockpit

* criar domínio
* versionar carta de domínio
* registrar fonte
* executar ingestão
* criar entidade manual
* criar relação manual
* validar/rejeitar objetos
* abrir conflito
* promover para canônico
* comparar versões
* exportar consulta

## 8.3 Requisitos de simetria

Para toda operação crítica do cockpit deve existir:

* endpoint ou tool equivalente para MCP
* trilha de auditoria equivalente
* exposição de justificativa e evidência

## 9. MCP — requisitos funcionais

O MCP é a superfície agentiva formal do Nexus. Ele não substitui o runtime; ele expõe capacidades operacionais controladas ao agente.

## 9.1 Capacidades mínimas do MCP

### Consulta

* get_domain
* list_domains
* get_domain_version
* list_entities
* get_entity
* list_relations
* get_relation
* list_events
* get_conflict_case
* search_evidence

### Mutação controlada

* create_domain
* create_domain_version
* activate_domain_version
* register_source
* run_ingestion
* create_local_entity
* create_relation_assertion
* validate_object
* reject_object
* open_conflict_case
* promote_to_canonical

### Operações compostas

* ingest_pst_domain_batch
* reconcile_project_entities
* compare_domain_versions
* export_domain_snapshot

## 9.2 Contrato mínimo das tools MCP

Toda tool de mutação deve exigir:

* actor identity
* reason
* domain context
* payload validado
* política de autorização

Toda resposta deve retornar:

* status
* ids afetados
* eventos gerados
* warnings
* referência de evidência ou logs

## 9.3 Restrições do MCP

* nenhuma tool pode alterar objetos sem gerar Transformation Event
* nenhuma tool pode promover canônico sem regra ou aprovação explícita
* nenhuma tool pode burlar carta de domínio vigente
* tools experimentais devem ser marcadas como non-canonical

## 10. Módulo de domínio A — Governança de Projetos

## 10.1 Finalidade

Representar projetos, entregas, decisões, riscos, atores, artefatos e ciclos de governança como memória relacional auditável.

## 10.2 Escopo do domínio

O domínio deve suportar pelo menos:

* projetos
  n- iniciativas
* workstreams
* tarefas críticas
* milestones
* decisões
* riscos
* stakeholders
* artefatos
* reuniões
* dependências
* estados de execução

## 10.3 Fontes suportadas

* markdown_file
* manual_entry
* json_file
* email_message
* api_result

## 10.4 Tipos mínimos de entidade local

* Project
* Initiative
* Workstream
* Task
* Milestone
* Decision
* Risk
* Stakeholder
* Artifact
* Meeting
* StatusUpdate

## 10.5 Tipos mínimos de relação

* DEPENDS_ON
* IMPLEMENTS
* BELONGS_TO
* BLOCKS
* SUPPORTS
* DECIDED_IN
* ASSIGNED_TO
* PRODUCES
* REFERENCES
* SUPERSEDES
* RISKS
* TRACKS

## 10.6 Campos mínimos por tipo

### Project

* title
* description
* objective
* sponsor
* status
* start_date
* target_date

### Task

* title
* status
* owner
* priority
* due_date
* linked_project

### Decision

* title
* decision_text
* rationale
* decision_date
* decided_by
* affected_scope

### Risk

* title
* description
* severity
* likelihood
* mitigation
* owner

### Artifact

* title
* artifact_type
* path_or_locator
* version_label
* related_project

## 10.7 Regras mínimas de ingestão

* toda tarefa deve apontar para projeto ou workstream
* toda decisão deve registrar racionalidade ou evidência
* riscos sem owner entram como proposed com warning
* artefatos devem manter locator rastreável
* reuniões podem gerar entidades Decision e ActionItem derivadas

## 10.8 Regras mínimas de promoção

* Project pode virar canônico quando referenciado por múltiplas fontes e validado
* Stakeholder pode virar canônico quando reconciliado com e-mail e projetos
* Artifact não vira canônico por padrão; depende de regra específica

## 10.9 Operações específicas do módulo

* importar snapshot de projeto
* extrair decisões de atas
* reconciliar artefatos com projetos
* abrir mapa de dependências
* consolidar risco por projeto

## 11. Módulo de domínio B — E-mail (Outlook PST)

## 11.1 Finalidade

Transformar um arquivo PST em memória relacional auditável, preservando estrutura de mensagens, participantes, threads, anexos, datas e vínculos com outros domínios.

## 11.2 Escopo do domínio

O módulo deve suportar:

* ingestão de PST local
* leitura de pastas
* extração de mensagens
* extração de cabeçalhos
* extração de participantes
* extração de anexos e metadados
* reconstrução de threads quando possível
* geração de entidades relacionáveis a projetos, decisões e artefatos

## 11.3 Fontes suportadas

* file_pst
* email_message
* attachment_file

## 11.4 Tipos mínimos de entidade local

* EmailMailbox
* EmailFolder
* EmailThread
* EmailMessage
* EmailParticipant
* Attachment
* EmailTopicCandidate
* EmailActionCandidate

## 11.5 Tipos mínimos de relação

* CONTAINS
* BELONGS_TO_FOLDER
* BELONGS_TO_THREAD
* SENT_BY
* SENT_TO
* CC_TO
* BCC_TO
* HAS_ATTACHMENT
* REPLIES_TO
* MENTIONS
* REFERENCES_PROJECT
* REFERENCES_ARTIFACT
* SUGGESTS_DECISION
* SUGGESTS_TASK

## 11.6 Campos mínimos por tipo

### EmailMessage

* message_id_external
* subject
* sent_at
* received_at
* sender
* to_recipients
* cc_recipients
* bcc_recipients
* body_text
* body_html_ref
* folder_path
* internet_message_id

### Attachment

* filename
* media_type
* size_bytes
* extracted_text_ref
* hash

### EmailParticipant

* display_name
* email_address
* participant_role

### EmailThread

* thread_key
* inferred_subject_root
* message_count
* first_message_at
* last_message_at

## 11.7 Regras mínimas de ingestão do PST

* o arquivo PST deve ser registrado como Source
* cada execução gera um Ingestion Run versionado
* cada pasta deve gerar EmailFolder
* cada mensagem deve gerar EmailMessage
* anexos devem gerar Attachment quando acessíveis
* participantes devem ser extraídos mesmo sem reconciliação prévia
* falhas parciais de parsing não devem abortar toda ingestão; devem gerar warnings por unidade

## 11.8 Normalização mínima

* normalizar e-mail em lowercase
* preservar subject original
* gerar subject_root heurístico para agrupamento
* preservar timezone quando disponível
* deduplicar mensagens por internet_message_id ou hash heurístico

## 11.9 Regras de relação automática

* mensagem para participante: SENT_BY / SENT_TO / CC_TO / BCC_TO
* mensagem para anexo: HAS_ATTACHMENT
* mensagem para pasta: BELONGS_TO_FOLDER
* mensagem para thread: BELONGS_TO_THREAD
* mensagem para mensagem anterior: REPLIES_TO quando identificável

## 11.10 Regras de extração assistida

O módulo pode propor, com status proposed:

* EmailTopicCandidate
* EmailActionCandidate
* possíveis vínculos com Project ou Artifact

Essas propostas não entram como canônicas sem revisão.

## 11.11 Operações específicas do módulo

* registrar PST
* fazer preview do conteúdo do PST
* ingerir PST completo
* ingerir pasta específica
* reprocessar mensagens falhas
* extrair anexos selecionados
* vincular mensagens a projeto
* abrir thread como sequência temporal

## 12. Integração entre módulos

## 12.1 Vínculos mínimos entre E-mail e Projetos

O sistema deve permitir:

* ligar EmailMessage a Project
* ligar EmailMessage a Decision
* ligar Attachment a Artifact
* ligar EmailParticipant a Stakeholder
* propor Task a partir de mensagem
* propor Decision a partir de thread

## 12.2 Política de integração

Esses vínculos podem nascer automaticamente como proposed, mas sua validação deve respeitar:

* evidência explícita
* carta do domínio de destino
* regra de reconciliação
* histórico de aprovação

## 13. Casos de conflito e reconciliação

## 13.1 Tipos mínimos de conflito

* entidades duplicadas
* equivalência provável não resolvida
* relação contraditória
* mudança de regra impactando classificação antiga
* baixa confiança em promoção canônica

## 13.2 Conflict Case

Campos mínimos:

* conflict_id
* conflict_type
* involved_object_refs
* description
* opened_at
* opened_by
* status
* resolution_note
* resolved_at

Status mínimos:

* open
* under_review
* resolved
* dismissed

## 14. Ingestion Runs e observabilidade

## 14.1 Ingestion Run

Campos mínimos:

* ingestion_run_id
* source_id
* domain_id
* adapter_used
* started_at
* finished_at
* status
* objects_created
* objects_updated
* warnings_count
* errors_count
* run_log_ref

## 14.2 Requisitos mínimos de observabilidade

Cada run deve expor:

* duração
* throughput básico
* warnings e erros por unidade
* número de entidades criadas
* número de relações criadas
* número de objetos rejeitados
* possibilidade de drill-down por item falho

## 15. Busca e recuperação

O Nexus deve oferecer busca mínima por:

* domínio
* tipo de objeto
* label / subject / title
* período
* participante / owner
* status de validação
* nível de confiança

A busca semântica vetorial é opcional nesta fase. A busca lexical estruturada é obrigatória.

## 16. Controle de acesso e autoridade

## 16.1 Perfis mínimos

* human_admin
* human_operator
* agent_operator
* agent_readonly
* system_runtime

## 16.2 Regras mínimas

* agent_readonly não muta
* agent_operator só muta via tools autorizadas
* promoção canônica exige human_admin ou regra explícita de autoaprovação
* mudança de carta de domínio exige operador autorizado

## 17. Exportação e portabilidade

O Nexus deve permitir exportar, no mínimo:

* snapshot de domínio
* carta de domínio vigente
* trilha de eventos filtrada
* subgrafo de entidade
* resultados de ingestão

Formatos mínimos:

* JSON
* Markdown
* CSV para listagens tabulares

## 18. Critérios de prontidão funcional

Um Nexus será considerado funcionalmente pronto nesta versão quando:

* for possível criar e versionar domínios
* o núcleo fino estiver presente em todos os objetos persistentes
* toda mutação crítica gerar Transformation Event
* o cockpit permitir operar ingestão, inspeção, validação e auditoria
* o MCP expuser consulta e mutação controlada equivalentes
* o módulo de Governança de Projetos ingerir fontes manuais e markdown
* o módulo de E-mail ingerir pelo menos um PST com mensagens, participantes, anexos e threads básicos
* vínculos entre e-mail e projeto puderem ser propostos e validados

## 19. Critérios de falha estrutural

O sistema deve ser considerado estruturalmente inadequado se ocorrer qualquer uma das condições abaixo:

* entidades persistidas sem domínio
* mutações sem evento auditável
* promoção canônica sem backing set rastreável
* carta de domínio não versionada
* regras efetivas fora do substrato
* agente com capacidade crítica sem equivalente funcional humano
* ingestão de PST produzindo objetos não rastreáveis à fonte

## 20. Roadmap lógico de implementação

### Fase 1 — Core mínimo

* schema persistente
* CRUD de domínios e versões
* CRUD de entidades e relações
* event log
* cockpit básico
* MCP básico

### Fase 2 — Módulo Projetos

* carta do domínio
* parser de markdown/manual
* views de projeto, decisão, risco e artefato
* reconciliação básica

### Fase 3 — Módulo PST

* registro de PST
* parser de PST
* entidades de mailbox/folder/message/attachment
* reconstrução de thread básica
* integração inicial com projetos

### Fase 4 — Governança e canonicidade

* conflict cases
* promoção canônica
* merge/split
* comparação de versões

### Fase 5 — Refinamento operacional

* filtros avançados
* subgrafo visual
* exportações
* métricas de qualidade e observabilidade

## 21. Resumo executivo

Esta especificação define o Nexus completo como uma infraestrutura cognitiva operacional baseada em domínios versionados, objetos relacionais auditáveis e superfícies simétricas para humanos e agentes. O core é composto por estrutura de dados, runtime, cockpit e MCP. Sobre esse core, dois módulos iniciais tornam o sistema imediatamente útil: Governança de Projetos e ingestão de E-mail a partir de PST. O desenho funcional garante que memória, contexto e transformação deixem de ser implícitos e passem a ser institucionais, rastreáveis e operáveis.
