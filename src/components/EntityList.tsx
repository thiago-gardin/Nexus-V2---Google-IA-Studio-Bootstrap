import React, { useState } from 'react';
import { useNexusStore } from '../store';
import { Database, ShieldCheck, Globe, Check, X, AlertTriangle } from 'lucide-react';
import { ConflictModal } from './ConflictModal';
import { useValidateObject, useRejectObject } from '../hooks/useMutations';

export function EntityList({ fullWidth = false }: { fullWidth?: boolean }) {
  const { localEntities, domains, openConflict } = useNexusStore();
  const entityList = Object.values(localEntities || {});
  const validate = useValidateObject();
  const reject = useRejectObject();

  const [inlineConfirm, setInlineConfirm] = useState<{ type: 'validate' | 'reject'; entityId: string; reason: string } | null>(null);

  const [conflictModalState, setConflictModalState] = useState<{
    isOpen: boolean;
    entityId: string;
  }>({ isOpen: false, entityId: '' });

  const handleConflictConfirm = async (conflictType: string, description: string) => {
    const actor = { actor_id: 'human_admin', actor_type: 'human' as const, performed_via: 'Cockpit UI' };
    await openConflict({
      target_object_id: conflictModalState.entityId,
      target_object_type: 'LocalEntity',
      conflict_type: conflictType,
      description,
      provenance: actor
    }, description);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          Local Entities
        </h2>
        <div className="flex gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1"><Database className="w-4 h-4" /> {entityList.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {entityList.length === 0 ? (
          <div className="text-zinc-600 text-sm italic flex flex-col items-center justify-center h-full gap-2">
            <Database className="w-8 h-8 opacity-20" />
            No entities in memory.
          </div>
        ) : (
          entityList.map(ent => (
            <React.Fragment key={ent.id}>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase tracking-wider rounded font-mono">
                        {ent.entity_type}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {domains[ent.domain_id]?.name || 'Unknown Domain'}
                      </span>
                    </div>
                    <h4 className="text-zinc-200 font-medium">{ent.label}</h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      ent.validation_status === 'proposed' ? 'text-amber-500 bg-amber-500/10' :
                      ent.validation_status === 'validated' ? 'text-emerald-500 bg-emerald-500/10' :
                      'text-red-500 bg-red-500/10'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {ent.validation_status}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">v{ent.version}</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                  <div className="flex gap-4">
                    <span>ID: {ent.id}</span>
                    <span>By: {ent.provenance.actor_id}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {ent.validation_status === 'proposed' && (
                      <>
                        <button
                          onClick={() => setInlineConfirm({ type: 'validate', entityId: ent.id, reason: '' })}
                          className="p-1 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-500 rounded transition-colors"
                          title="Validate"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInlineConfirm({ type: 'reject', entityId: ent.id, reason: '' })}
                          className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded transition-colors"
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setConflictModalState({ isOpen: true, entityId: ent.id })}
                      className="p-1 hover:bg-amber-500/20 text-zinc-500 hover:text-amber-500 rounded transition-colors"
                      title="Open Conflict"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Confirmation */}
              {inlineConfirm?.entityId === ent.id && (
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
                        if (inlineConfirm.type === 'validate') validate('LocalEntity', ent.id, inlineConfirm.reason);
                        else reject('LocalEntity', ent.id, inlineConfirm.reason);
                        setInlineConfirm(null);
                      }
                      if (e.key === 'Escape') setInlineConfirm(null);
                    }}
                  />
                  <button 
                    disabled={!inlineConfirm.reason}
                    onClick={() => {
                      if (inlineConfirm.type === 'validate') validate('LocalEntity', ent.id, inlineConfirm.reason);
                      else reject('LocalEntity', ent.id, inlineConfirm.reason);
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
        targetId={conflictModalState.entityId}
      />
    </div>
  );
}
