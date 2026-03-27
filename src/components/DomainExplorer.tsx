import React, { useState, useMemo } from 'react';
import { useNexusStore } from '../store';
import { Globe, Database, Network, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ENTITY_STYLES } from '../config/cockpit.config';

export function DomainExplorer({ fullWidth = false }: { fullWidth?: boolean }) {
  const { domains, localEntities, relationAssertions, domainVersions } = useNexusStore();
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [charterExpanded, setCharterExpanded] = useState(false)
  
  const domainList = useMemo(() => Object.values(domains || {}), [domains]);
  const entities = useMemo(() => Object.values(localEntities || {}), [localEntities]);
  const relations = useMemo(() => Object.values(relationAssertions || {}), [relationAssertions]);

  const selectedDomain = useMemo(() => 
    selectedDomainId ? domains[selectedDomainId] : null
  , [domains, selectedDomainId]);

  const activeVersion = useMemo(() => Object.values(domainVersions || {})
    .find(v => v.domain_id === selectedDomainId
      && v.status === 'active'), [domainVersions, selectedDomainId])

  const domainStats = useMemo(() => {
    const stats: Record<string, { entities: number; relations: number }> = {};
    domainList.forEach(d => {
      stats[d.id] = {
        entities: entities.filter(e => e.domain_id === d.id).length,
        relations: relations.filter(r => r.domain_id === d.id).length
      };
    });
    return stats;
  }, [domainList, entities, relations]);

  const detailMetrics = useMemo(() => {
    if (!selectedDomainId) return null;
    const dEntities = entities.filter(e => e.domain_id === selectedDomainId);
    const proposed = dEntities.filter(e => e.validation_status === 'proposed').length;
    const conflicts = dEntities.filter(e => e.validation_status === 'contested').length;
    const validated = dEntities.filter(e => e.validation_status === 'validated').length;
    const validatedPct = dEntities.length > 0 ? (validated / dEntities.length) * 100 : 0;

    const breakdown = dEntities.reduce((acc, e) => {
      acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { proposed, conflicts, validated, validatedPct, breakdown, total: dEntities.length };
  }, [selectedDomainId, entities]);

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-xl flex h-full overflow-hidden ${fullWidth ? 'w-full' : ''}`}>
      {/* Left: List */}
      <div className="w-[40%] border-r border-zinc-800 flex flex-col overflow-hidden">
        <div className="h-14 shrink-0 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/50">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Domains
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-900">
          {domainList.map(domain => {
            const isSelected = selectedDomainId === domain.id;
            const stats = domainStats[domain.id];
            return (
              <button
                key={domain.id}
                onClick={() => setSelectedDomainId(domain.id)}
                className={`w-full h-[52px] flex items-center px-4 gap-3 transition-all relative ${
                  isSelected ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'
                }`}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />}
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-[12px] font-bold text-zinc-200 truncate">{domain.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-0.5"><Database className="w-2.5 h-2.5" /> {stats.entities}</span>
                    <span className="flex items-center gap-0.5"><Network className="w-2.5 h-2.5" /> {stats.relations}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  domain.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}>
                  {domain.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {selectedDomain ? (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/30">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-zinc-100">{selectedDomain.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-zinc-500">{selectedDomain.slug}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(selectedDomain.created_at))} ago
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                  selectedDomain.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}>
                  {selectedDomain.status}
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">{selectedDomain.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Integrity Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Proposed</span>
                    <Database className="w-3 h-3 text-amber-500" />
                  </div>
                  <span className="text-2xl font-semibold text-zinc-100">{detailMetrics?.proposed}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Conflicts</span>
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-2xl font-semibold text-zinc-100">{detailMetrics?.conflicts}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Validated</span>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-semibold text-zinc-100">{detailMetrics?.validatedPct.toFixed(0)}%</span>
                    <span className="text-[10px] text-zinc-500 mb-1">of {detailMetrics?.total}</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${detailMetrics?.validatedPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Entity Breakdown */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entity Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(detailMetrics?.breakdown || {}).map(([type, count]) => {
                    const style = ENTITY_STYLES[type] || ENTITY_STYLES.default;
                    const countNum = count as number;
                    const pct = detailMetrics ? (countNum / detailMetrics.total) * 100 : 0;
                    return (
                      <div key={type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter" style={{ backgroundColor: style.bg, color: '#fff' }}>
                              {type}
                            </span>
                            <span className="text-zinc-400 font-medium">{countNum} entities</span>
                          </div>
                          <span className="text-zinc-500 font-mono">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: style.bg }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Charter Section */}
              <div className="mt-4">
                <button
                  className="flex items-center gap-2 text-[10px]
                    font-bold text-zinc-500 uppercase tracking-widest
                    hover:text-zinc-300 transition-colors w-full"
                  onClick={() => setCharterExpanded(!charterExpanded)}>
                  <span>{charterExpanded ? '▼' : '▶'}</span>
                  Charter
                  {activeVersion && (
                    <span className="text-zinc-600 font-mono normal-case
                      tracking-normal ml-1">
                      v{activeVersion.version_number}
                    </span>
                  )}
                </button>

                {charterExpanded && activeVersion && (
                  <div className="mt-3 space-y-3">

                    <div>
                      <div className="text-[9px] text-zinc-600 uppercase
                        tracking-wider mb-2">Entity types</div>
                      <div className="flex flex-wrap gap-1">
                        {(activeVersion.schema_json?.allowed_entity_types || [])
                          .map((t: string) => (
                            <span key={t}
                              className="text-[10px] px-2 py-0.5 rounded
                                bg-zinc-800 text-zinc-300 border
                                border-zinc-700">
                              {t}
                            </span>
                          ))
                        }
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-zinc-600 uppercase
                        tracking-wider mb-2">Relation types</div>
                      <div className="flex flex-wrap gap-1">
                        {(activeVersion.schema_json?.allowed_relation_types || [])
                          .map((t: string) => (
                            <span key={t}
                              className="text-[10px] px-2 py-0.5 rounded
                                bg-zinc-800 text-zinc-400 font-mono
                                border border-zinc-700">
                              {t}
                            </span>
                          ))
                        }
                      </div>
                    </div>

                    {activeVersion.charter_text && (
                      <div>
                        <div className="text-[9px] text-zinc-600 uppercase
                          tracking-wider mb-1">Charter text</div>
                        <div className="text-[11px] text-zinc-400
                          leading-relaxed bg-zinc-900 rounded p-2
                          border border-zinc-800">
                          {activeVersion.charter_text}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {charterExpanded && !activeVersion && (
                  <div className="mt-2 text-[10px] text-zinc-600 italic">
                    No active charter version.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-2 italic text-sm">
            <Globe className="w-12 h-12 opacity-10" />
            Select a domain to view details
          </div>
        )}
      </div>
    </div>
  );
}
