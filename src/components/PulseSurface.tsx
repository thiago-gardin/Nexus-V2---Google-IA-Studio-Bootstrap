import React, { useState, useMemo } from 'react';
import { 
  Zap, Bot, User, CheckCircle, Search, ChevronUp, ChevronDown, 
  Check, X, AlertTriangle, Clock, Database, Globe, ExternalLink,
  MoreVertical, ArrowRight, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNexusDelta } from '../hooks/useNexusDelta';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { useNexusEntities } from '../hooks/useNexusEntities';
import { useValidateObject, useRejectObject, useOpenConflict } from '../hooks/useMutations';
import { useNexusStore } from '../store';
import { 
  ENTITY_STYLES, ACTOR_COLORS, VALIDATION_BG, THRESHOLDS 
} from '../config/cockpit.config';
import { LocalEntity, RelationAssertion } from '../types';

interface PulseSurfaceProps {
  setActiveTab: (tab: string) => void;
}

export const PulseSurface: React.FC<PulseSurfaceProps> = ({ setActiveTab }) => {
  const { newEntities, newRelations, newEvents, byAgent, byHuman, lastVisit } = useNexusDelta();
  const queue = useDecisionQueue();
  const { entities, loading } = useNexusEntities();
  const { domains, relationAssertions, events } = useNexusStore();
  
  const validate = useValidateObject();
  const reject = useRejectObject();
  const openConflict = useOpenConflict();

  const [filterTab, setFilterTab] = useState<'ALL' | 'PROPOSED' | 'VALIDATED' | 'CONFLICTS' | 'NEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'AGE', direction: 'desc' });
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [inlineConfirm, setInlineConfirm] = useState<{ type: 'validate' | 'reject'; entityId: string; reason: string } | null>(null);

  const selectedEntity = useMemo(() => 
    entities.find(e => e.id === selectedEntityId) || null
  , [entities, selectedEntityId]);

  const filteredEntities = useMemo(() => {
    let list = [...entities];

    // Tab Filter
    if (filterTab === 'PROPOSED') list = list.filter(e => e.validation_status === 'proposed');
    if (filterTab === 'VALIDATED') list = list.filter(e => e.validation_status === 'validated');
    if (filterTab === 'CONFLICTS') list = list.filter(e => e.validation_status === 'contested');
    if (filterTab === 'NEW') {
      const newIds = new Set(newEntities.map(e => e.id));
      list = list.filter(e => newIds.has(e.id));
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => e.label.toLowerCase().includes(q));
    }

    // Sorting
    list.sort((a, b) => {
      let valA: any, valB: any;
      if (sortConfig.key === 'TYPE') { valA = a.entity_type; valB = b.entity_type; }
      else if (sortConfig.key === 'LABEL') { valA = a.label; valB = b.label; }
      else if (sortConfig.key === 'DOMAIN') { valA = domains[a.domain_id]?.name || ''; valB = domains[b.domain_id]?.name || ''; }
      else if (sortConfig.key === 'ACTOR') { valA = a.provenance.actor_id; valB = b.provenance.actor_id; }
      else if (sortConfig.key === 'STATUS') { valA = a.validation_status; valB = b.validation_status; }
      else if (sortConfig.key === 'AGE') { valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime(); }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [entities, filterTab, searchQuery, sortConfig, domains, newEntities]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const lastEventTime = events.length > 0 ? formatDistanceToNow(new Date(events[events.length - 1].timestamp)) : 'never';

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-300 overflow-hidden">
      {/* ZONA 1 — DELTA BAND */}
      <div className="h-12 shrink-0 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-4 overflow-x-auto no-scrollbar">
        {lastVisit === null ? (
          <span className="text-[11px] font-mono text-zinc-400">Welcome. This is your first session.</span>
        ) : (newEntities.length + newRelations.length) === 0 ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-mono text-zinc-400">No changes since last visit · {new Date().toLocaleTimeString()}</span>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{newEntities.length + newRelations.length} new since last visit</span>
            </div>
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-blue-500" />
              <span>{byAgent} by agent</span>
            </div>
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-zinc-500" />
              <span>{byHuman} by human</span>
            </div>
            <span className="text-zinc-700">·</span>
            <span>Last visit: {formatDistanceToNow(new Date(lastVisit))} ago</span>
          </div>
        )}
      </div>

      {/* ZONA 2 — DECISION QUEUE */}
      <div className="h-20 shrink-0 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 overflow-x-auto no-scrollbar gap-3">
        {queue.length === 0 ? (
          <span className="text-[11px] font-mono text-zinc-600">System stable — no pending decisions</span>
        ) : (
          queue.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.targetTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded border transition-all shrink-0 group ${
                item.urgent 
                  ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              {item.urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              <span className={`text-[11px] font-bold ${item.urgent ? 'text-red-400' : 'text-amber-400'}`}>
                {item.count} {item.label}
              </span>
            </button>
          ))
        )}
      </div>

      {/* ZONA 3 — TABELA PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lado Esquerdo: Tabela */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header da Tabela */}
          <div className="shrink-0 bg-zinc-900 sticky top-0 z-10">
            {/* Linha 1: Filtros */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
              <div className="flex items-center gap-1">
                {(['ALL', 'PROPOSED', 'VALIDATED', 'CONFLICTS', 'NEW'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      filterTab === tab ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded px-8 py-1 text-[11px] focus:outline-none focus:border-emerald-500 w-48 transition-all"
                />
              </div>
            </div>
            {/* Linha 2: Cabeçalhos */}
            <div className="h-9 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <div className="w-1 shrink-0" />
              <div className="w-24 px-2 cursor-pointer hover:text-zinc-300 flex items-center gap-1" onClick={() => handleSort('TYPE')}>
                TYPE {sortConfig.key === 'TYPE' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </div>
              <div className="flex-1 px-2 cursor-pointer hover:text-zinc-300 flex items-center gap-1" onClick={() => handleSort('LABEL')}>
                LABEL {sortConfig.key === 'LABEL' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </div>
              <div className="w-32 px-2 cursor-pointer hover:text-zinc-300 flex items-center gap-1" onClick={() => handleSort('DOMAIN')}>
                DOMAIN {sortConfig.key === 'DOMAIN' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </div>
              <div className="w-32 px-2 cursor-pointer hover:text-zinc-300 flex items-center gap-1" onClick={() => handleSort('ACTOR')}>
                ACTOR {sortConfig.key === 'ACTOR' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </div>
              <div className="w-24 px-2 cursor-pointer hover:text-zinc-300 flex items-center gap-1" onClick={() => handleSort('STATUS')}>
                STATUS {sortConfig.key === 'STATUS' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </div>
              <div className="w-24 px-2 cursor-pointer hover:text-zinc-300 flex items-center gap-1" onClick={() => handleSort('AGE')}>
                AGE {sortConfig.key === 'AGE' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </div>
              <div className="w-20 px-2 text-right">ACTIONS</div>
            </div>
          </div>

          {/* Corpo da Tabela */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredEntities.map(entity => {
              const isNew = newEntities.some(ne => ne.id === entity.id);
              const isSelected = selectedEntityId === entity.id;
              const style = ENTITY_STYLES[entity.entity_type] || ENTITY_STYLES.default;
              const actorColor = ACTOR_COLORS[entity.provenance.actor_type] || ACTOR_COLORS.system;
              const ageMs = new Date().getTime() - new Date(entity.created_at).getTime();
              
              let ageColor = 'text-zinc-600';
              if (entity.validation_status === 'proposed') {
                if (ageMs > THRESHOLDS.PROPOSED_STALE_CRITICAL) ageColor = 'text-red-500';
                else if (ageMs > THRESHOLDS.PROPOSED_STALE_WARN) ageColor = 'text-amber-500';
              }

              return (
                <React.Fragment key={entity.id}>
                  <div 
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`h-10 flex items-center px-4 cursor-pointer transition-colors group relative border-b border-zinc-900/50 ${
                      isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-900'
                    }`}
                    style={{ backgroundColor: isSelected ? undefined : VALIDATION_BG[entity.validation_status] }}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />}
                    <div className="w-1 h-full shrink-0" style={{ backgroundColor: actorColor }} />
                    
                    <div className="w-24 px-2 flex items-center gap-2">
                      {isNew && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter" style={{ backgroundColor: style.bg, color: '#fff' }}>
                        {entity.entity_type}
                      </span>
                    </div>
                    
                    <div className="flex-1 px-2 text-[12px] text-zinc-200 truncate font-medium">
                      {entity.label}
                    </div>
                    
                    <div className="w-32 px-2 text-[11px] text-zinc-500 truncate">
                      {domains[entity.domain_id]?.name || 'Unknown'}
                    </div>
                    
                    <div className="w-32 px-2 flex items-center gap-1.5">
                      {entity.provenance.actor_type === 'agent' ? <Bot className="w-3 h-3 text-blue-500" /> : <User className="w-3 h-3 text-zinc-500" />}
                      <span className="text-[11px] text-zinc-500 font-mono">{entity.provenance.actor_id.substring(0, 8)}</span>
                    </div>
                    
                    <div className="w-24 px-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        entity.validation_status === 'proposed' ? 'text-amber-500' :
                        entity.validation_status === 'validated' ? 'text-emerald-500' :
                        entity.validation_status === 'rejected' ? 'text-red-500' : 'text-purple-500'
                      }`}>
                        {entity.validation_status}
                      </span>
                    </div>
                    
                    <div className={`w-24 px-2 text-[11px] font-mono ${ageColor}`}>
                      {formatDistanceToNow(new Date(entity.created_at))}
                    </div>
                    
                    <div className="w-20 px-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {entity.validation_status === 'proposed' && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setInlineConfirm({ type: 'validate', entityId: entity.id, reason: '' }); }}
                            className="p-1 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-500 rounded transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setInlineConfirm({ type: 'reject', entityId: entity.id, reason: '' }); }}
                            className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* Conflict logic handled by store/modal */ }}
                        className="p-1 hover:bg-purple-500/20 text-zinc-500 hover:text-purple-500 rounded transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Confirmation */}
                  {inlineConfirm?.entityId === entity.id && (
                    <div className="bg-zinc-900 border-b border-zinc-800 px-12 py-2 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${inlineConfirm.type === 'validate' ? 'text-emerald-500' : 'text-red-500'}`}>
                        Confirm {inlineConfirm.type}:
                      </span>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Reason (required)..."
                        value={inlineConfirm.reason}
                        onChange={(e) => setInlineConfirm({ ...inlineConfirm, reason: e.target.value })}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-zinc-600"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inlineConfirm.reason) {
                            if (inlineConfirm.type === 'validate') validate('entity', entity.id, inlineConfirm.reason);
                            else reject('entity', entity.id, inlineConfirm.reason);
                            setInlineConfirm(null);
                          }
                          if (e.key === 'Escape') setInlineConfirm(null);
                        }}
                      />
                      <button 
                        disabled={!inlineConfirm.reason}
                        onClick={() => {
                          if (inlineConfirm.type === 'validate') validate('entity', entity.id, inlineConfirm.reason);
                          else reject('entity', entity.id, inlineConfirm.reason);
                          setInlineConfirm(null);
                        }}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          inlineConfirm.reason 
                            ? (inlineConfirm.type === 'validate' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white')
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        Confirm
                      </button>
                      <button onClick={() => setInlineConfirm(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase font-bold">Cancel</button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Painel de Inspeção */}
        {selectedEntity && (
          <div className="w-[320px] shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter" style={{ backgroundColor: (ENTITY_STYLES[selectedEntity.entity_type] || ENTITY_STYLES.default).bg, color: '#fff' }}>
                    {selectedEntity.entity_type}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">v{selectedEntity.version}</span>
                </div>
                <h2 className="text-lg font-semibold text-zinc-100 leading-tight">{selectedEntity.label}</h2>
              </div>
              <button onClick={() => setSelectedEntityId(null)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
              {/* Status Row */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    selectedEntity.validation_status === 'proposed' ? 'text-amber-500' :
                    selectedEntity.validation_status === 'validated' ? 'text-emerald-500' :
                    selectedEntity.validation_status === 'rejected' ? 'text-red-500' : 'text-purple-500'
                  }`}>
                    {selectedEntity.validation_status}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Confidence: {(selectedEntity.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${selectedEntity.confidence * 100}%` }} />
                </div>
              </div>

              {/* Provenance */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Provenance</h3>
                <div className="p-3 bg-zinc-900/50 rounded border-l-2" style={{ borderColor: ACTOR_COLORS[selectedEntity.provenance.actor_type] }}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedEntity.provenance.actor_type === 'agent' ? <Bot className="w-3.5 h-3.5 text-blue-500" /> : <User className="w-3.5 h-3.5 text-zinc-500" />}
                    <span className="text-[11px] font-bold text-zinc-300">{selectedEntity.provenance.actor_id}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">Via: {selectedEntity.provenance.performed_via}</div>
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attributes</h3>
                <div className="space-y-1.5">
                  {Object.entries(selectedEntity.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 py-1 border-b border-zinc-900/50">
                      <span className="text-[11px] text-zinc-500 font-mono">{key}</span>
                      <span className="text-[11px] text-zinc-300 text-right">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relations */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Relations</h3>
                <div className="space-y-1">
                  {Object.values(relationAssertions || {})
                    .filter(r => r.source_entity_id === selectedEntity.id || r.target_entity_id === selectedEntity.id)
                    .map(rel => {
                      const isSource = rel.source_entity_id === selectedEntity.id;
                      const otherId = isSource ? rel.target_entity_id : rel.source_entity_id;
                      const otherEntity = entities.find(e => e.id === otherId);
                      
                      return (
                        <div 
                          key={rel.id} 
                          onClick={() => otherId && setSelectedEntityId(otherId)}
                          className="flex items-center gap-2 p-2 rounded hover:bg-zinc-900 cursor-pointer transition-colors group"
                        >
                          {isSource ? <ArrowRight className="w-3 h-3 text-zinc-600" /> : <ArrowLeft className="w-3 h-3 text-zinc-600" />}
                          <span className="flex-1 text-[11px] text-zinc-400 group-hover:text-zinc-200 truncate">{otherEntity?.label || 'Unknown'}</span>
                          <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{rel.relation_type}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Actions */}
              {selectedEntity.validation_status === 'proposed' && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setInlineConfirm({ type: 'validate', entityId: selectedEntity.id, reason: '' })}
                      className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/20 py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-all"
                    >
                      Validate
                    </button>
                    <button 
                      onClick={() => setInlineConfirm({ type: 'reject', entityId: selectedEntity.id, reason: '' })}
                      className="flex-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-all"
                    >
                      Reject
                    </button>
                  </div>
                  {inlineConfirm?.entityId === selectedEntity.id && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Reason (required)..."
                        value={inlineConfirm.reason}
                        onChange={(e) => setInlineConfirm({ ...inlineConfirm, reason: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-zinc-600"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setInlineConfirm(null)} className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase">Cancel</button>
                        <button 
                          disabled={!inlineConfirm.reason}
                          onClick={() => {
                            if (inlineConfirm.type === 'validate') validate('entity', selectedEntity.id, inlineConfirm.reason);
                            else reject('entity', selectedEntity.id, inlineConfirm.reason);
                            setInlineConfirm(null);
                          }}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            inlineConfirm.reason 
                              ? (inlineConfirm.type === 'validate' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white')
                              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ZONA 4 — STATUS FOOTER */}
      <div className="h-8 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 justify-between text-[10px] font-mono text-zinc-600">
        <div className="flex items-center gap-4">
          <span>Nexus Cognitive Memory</span>
          <span className="text-zinc-800">|</span>
          <span>Schema v1.0</span>
          <span className="text-zinc-800">|</span>
          <span>{entities.length} objects</span>
        </div>
        <div>
          Last event {lastEventTime} ago
        </div>
      </div>
    </div>
  );
};
