import React, { useState, useMemo } from 'react';
import { useNexusStore } from '../store';
import { Network, ShieldCheck, ArrowRight, ArrowLeftRight, Check, X, AlertTriangle } from 'lucide-react';
import { ConflictModal } from './ConflictModal';
import { useValidateObject, useRejectObject } from '../hooks/useMutations';

export function RelationExplorer({ fullWidth = false }: { fullWidth?: boolean }) {
  const { relationAssertions, localEntities, openConflict } = useNexusStore();
  const relations = Object.values(relationAssertions || {});
  const validate = useValidateObject();
  const reject = useRejectObject();

  const [filter, setFilter] = useState<'all' | 'directed' | 'bidirectional'>('all');
  const [inlineConfirm, setInlineConfirm] = useState<{ type: 'validate' | 'reject'; relationId: string; reason: string } | null>(null);

  const [conflictModalState, setConflictModalState] = useState<{
    isOpen: boolean;
    relationId: string;
  }>({ isOpen: false, relationId: '' });

  const filteredRelations = useMemo(() => {
    if (filter === 'all') return relations;
    return relations.filter(r => filter === 'directed' ? r.directionality === 'directed' : r.directionality === 'bidirectional');
  }, [relations, filter]);

  const handleConflictConfirm = async (conflictType: string, description: string) => {
    const actor = { actor_id: 'human_admin', actor_type: 'human' as const, performed_via: 'Cockpit UI' };
    await openConflict({
      target_object_id: conflictModalState.relationId,
      target_object_type: 'RelationAssertion',
      conflict_type: conflictType,
      description,
      provenance: actor
    }, description);
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col h-full overflow-hidden ${fullWidth ? 'w-full' : ''}`}>
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            Relations
          </h2>
          <div className="flex bg-zinc-950 border border-zinc-800 rounded-md p-0.5">
            {(['all', 'directed', 'bidirectional'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-colors ${
                  filter === f ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1"><Network className="w-4 h-4" /> {filteredRelations.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {filteredRelations.length === 0 ? (
          <div className="text-zinc-600 text-sm italic flex flex-col items-center justify-center h-full gap-2">
            <Network className="w-8 h-8 opacity-20" />
            No relations found.
          </div>
        ) : (
          filteredRelations.map(rel => (
            <React.Fragment key={rel.id}>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider rounded font-mono">
                        {rel.relation_type}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        {rel.directionality === 'bidirectional' ? <ArrowLeftRight className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        <span className="uppercase tracking-tighter">{rel.directionality}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Source</span>
                        <span className="text-zinc-200 font-medium">{localEntities[rel.source_entity_id]?.label || rel.source_entity_id}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-700 mt-4" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Target</span>
                        <span className="text-zinc-200 font-medium">{localEntities[rel.target_entity_id]?.label || rel.target_entity_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      rel.validation_status === 'proposed' ? 'text-amber-500 bg-amber-500/10' :
                      rel.validation_status === 'validated' ? 'text-emerald-500 bg-emerald-500/10' :
                      'text-red-500 bg-red-500/10'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {rel.validation_status}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">v{rel.version}</span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-600 font-mono mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                  <div className="flex gap-4">
                    <span>ID: {rel.id}</span>
                    <span>By: {rel.provenance.actor_id}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {rel.validation_status === 'proposed' && (
                      <>
                        <button
                          onClick={() => setInlineConfirm({ type: 'validate', relationId: rel.id, reason: '' })}
                          className="p-1 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-500 rounded transition-colors"
                          title="Validate"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInlineConfirm({ type: 'reject', relationId: rel.id, reason: '' })}
                          className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded transition-colors"
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setConflictModalState({ isOpen: true, relationId: rel.id })}
                      className="p-1 hover:bg-amber-500/20 text-zinc-500 hover:text-amber-500 rounded transition-colors"
                      title="Open Conflict"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Confirmation */}
              {inlineConfirm?.relationId === rel.id && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200 mt-1">
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
                        if (inlineConfirm.type === 'validate') validate('RelationAssertion', rel.id, inlineConfirm.reason);
                        else reject('RelationAssertion', rel.id, inlineConfirm.reason);
                        setInlineConfirm(null);
                      }
                      if (e.key === 'Escape') setInlineConfirm(null);
                    }}
                  />
                  <button 
                    disabled={!inlineConfirm.reason}
                    onClick={() => {
                      if (inlineConfirm.type === 'validate') validate('RelationAssertion', rel.id, inlineConfirm.reason);
                      else reject('RelationAssertion', rel.id, inlineConfirm.reason);
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
          ))
        )}
      </div>

      <ConflictModal
        isOpen={conflictModalState.isOpen}
        onClose={() => setConflictModalState({ ...conflictModalState, isOpen: false })}
        onConfirm={handleConflictConfirm}
        targetId={conflictModalState.relationId}
      />
    </div>
  );
}
