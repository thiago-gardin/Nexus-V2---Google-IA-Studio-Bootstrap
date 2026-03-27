import React, { useState } from 'react';
import { useNexusStore } from '../store';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpCircle, CheckCircle } from 'lucide-react';
import { usePromoteCanonical } from '../hooks/useMutations';

export function GovernanceExplorer({ fullWidth = false }: { fullWidth?: boolean }) {
  const { conflictCases, localEntities, canonicalEntities, fetchState } = useNexusStore();
  const conflicts = Object.values(conflictCases || {});
  const entities = Object.values(localEntities || {});
  const canonicals = Object.values(canonicalEntities || {});
  const promote = usePromoteCanonical();

  const validatedCount = entities.filter(e => e.validation_status === 'validated').length;
  const openConflicts = conflicts.filter(c => c.status === 'open');
  const promotionCandidates = entities.filter(e => e.canonical_candidate_flag === true);

  const [inlineConfirm, setInlineConfirm] = useState<{ entityId: string; reason: string } | null>(null);
  const [resolvingConflictId, setResolvingConflictId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const handlePromote = async (entityId: string, justification: string) => {
    await promote(entityId, justification);
    setInlineConfirm(null);
  };

  const handleResolveConflict = async (conflictId: string, resolution: string, notes: string) => {
    try {
      await fetch(`/api/governance/conflict/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resolution, 
          resolution_notes: notes, 
          actor_id: 'human_admin' 
        })
      });
      await fetchState();
      setResolvingConflictId(null);
      setResolutionNote('');
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const isClean = openConflicts.length === 0 && promotionCandidates.length === 0;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden ${fullWidth ? 'w-full' : ''}`}>
      {/* Header */}
      <div className="h-14 shrink-0 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Governance
          </h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800 border-b border-zinc-800">
        <div className="bg-zinc-950 p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Validated</span>
          <span className="text-2xl font-semibold text-emerald-500">{validatedCount}</span>
        </div>
        <div className="bg-zinc-950 p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conflicts Open</span>
          <span className={`text-2xl font-semibold ${openConflicts.length > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
            {openConflicts.length}
          </span>
        </div>
        <div className="bg-zinc-950 p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Canonical</span>
          <span className="text-2xl font-semibold text-blue-500">{canonicals.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {isClean ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">Governance is clean.</h3>
              <p className="text-sm text-zinc-500 mt-1">
                {openConflicts.length} conflicts · {promotionCandidates.length} pending · {validatedCount} validated
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Conflict Cases Section */}
            {openConflicts.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Open Conflicts
                </h3>
                <div className="space-y-3">
                  {openConflicts.map(conflict => {
                    const entity = localEntities[conflict.target_object_id] || canonicalEntities[conflict.target_object_id];
                    const targetLabel = entity?.label || conflict.target_object_id;

                    return (
                      <div key={conflict.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                              {conflict.conflict_type}
                            </span>
                            <span className="text-xs font-bold text-zinc-300">
                              Target: {targetLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-600 font-mono">{new Date(conflict.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">{conflict.description}</p>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleResolveConflict(conflict.id, 'keep_original', 'Kept original — duplicate dismissed')}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded transition-colors"
                          >
                            Keep original
                          </button>
                          <button 
                            onClick={() => handleResolveConflict(conflict.id, 'dismissed', 'Conflict dismissed — no action required')}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded transition-colors"
                          >
                            Dismiss
                          </button>
                          <button 
                            onClick={() => setResolvingConflictId(conflict.id)}
                            className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded transition-colors"
                          >
                            Resolve...
                          </button>
                        </div>

                        {resolvingConflictId === conflict.id && (
                          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <textarea
                              autoFocus
                              placeholder="Resolution note (required)"
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && resolutionNote) {
                                  e.preventDefault();
                                  handleResolveConflict(conflict.id, 'resolved', resolutionNote);
                                }
                                if (e.key === 'Escape') {
                                  setResolvingConflictId(null);
                                  setResolutionNote('');
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600 min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setResolvingConflictId(null);
                                  setResolutionNote('');
                                }}
                                className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase hover:text-zinc-300"
                              >
                                Cancel
                              </button>
                              <button 
                                disabled={!resolutionNote}
                                onClick={() => handleResolveConflict(conflict.id, 'resolved', resolutionNote)}
                                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                  resolutionNote 
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                              >
                                Confirm Resolution
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Promotion Candidates Section */}
            {promotionCandidates.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Canonical Candidates
                </h3>
                <div className="space-y-2">
                  {promotionCandidates.map(ent => (
                    <React.Fragment key={ent.id}>
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-zinc-200">{ent.label}</span>
                            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {ent.entity_type}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono">ID: {ent.id}</div>
                        </div>
                        <button
                          onClick={() => setInlineConfirm({ entityId: ent.id, reason: '' })}
                          className="flex items-center gap-1.5 text-blue-500 hover:text-white bg-blue-500/10 hover:bg-blue-500 px-3 py-1.5 rounded transition-all text-[10px] font-bold uppercase tracking-wider"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Promote
                        </button>
                      </div>

                      {/* Inline Confirmation */}
                      {inlineConfirm?.entityId === ent.id && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                            Confirm Promotion:
                          </span>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Justification (required)..."
                            value={inlineConfirm.reason}
                            onChange={(e) => setInlineConfirm({ ...inlineConfirm, reason: e.target.value })}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-zinc-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && inlineConfirm.reason) {
                                handlePromote(ent.id, inlineConfirm.reason);
                              }
                              if (e.key === 'Escape') setInlineConfirm(null);
                            }}
                          />
                          <button 
                            disabled={!inlineConfirm.reason}
                            onClick={() => handlePromote(ent.id, inlineConfirm.reason)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              inlineConfirm.reason 
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            Confirm
                          </button>
                          <button onClick={() => setInlineConfirm(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase font-bold">Cancel</button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
