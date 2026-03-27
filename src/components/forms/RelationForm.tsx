import React, { useState } from 'react';
import { useNexusStore } from '../../store';
import { Network, Plus, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { Provenance } from '../../types';

interface RelationFormProps {
  onSuccess?: () => void;
  initialSource?: {sourceId: string, sourceLabel: string} | null;
  onInitialSourceUsed?: () => void;
}

export const RelationForm: React.FC<RelationFormProps> = ({ onSuccess, initialSource, onInitialSourceUsed }) => {
  const { domains, localEntities, createRelationAssertion } = useNexusStore();
  const [formData, setFormData] = useState({ domainId: '', sourceId: '', targetId: '', type: '', directionality: 'directed', justification: '' });
  const [sourceSearch, setSourceSearch] = useState('')
  const [targetSearch, setTargetSearch] = useState('')
  const [showSource, setShowSource] = useState(false)
  const [showTarget, setShowTarget] = useState(false)
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [knownTypes, setKnownTypes] = useState<{type: string, count: number, in_charter: boolean}[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialSource) {
      setFormData(prev => ({...prev, sourceId: initialSource.sourceId}))
      setSourceSearch(initialSource.sourceLabel)
      onInitialSourceUsed?.()
    }
  }, [initialSource])

  const entityOptions = Object.values(localEntities || {})
    .filter(e => !formData.domainId ||
      e.domain_id === formData.domainId)

  React.useEffect(() => {
    if (!formData.domainId) {
      setKnownTypes([]);
      return;
    }

    fetch(`/api/domains/${formData.domainId}/relation-types`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setKnownTypes(data.relation_types);
      });
  }, [formData.domainId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const actor: Provenance = { actor_id: 'human_admin', actor_type: 'human', performed_via: 'Cockpit UI' };
    try {
      await createRelationAssertion(
        { 
          domain_id: formData.domainId,
          source_entity_id: formData.sourceId,
          target_entity_id: formData.targetId,
          relation_type: formData.type,
          directionality: formData.directionality as any,
          attributes: attributes,
          provenance: actor
        },
        formData.justification
      );
      setFormData({ domainId: '', sourceId: '', targetId: '', type: '', directionality: 'directed', justification: '' });
      setAttributes({});
      onSuccess?.();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        <Network className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">New Relation</span>
      </div>
      
      <div className="space-y-3">
        <select 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" 
          value={formData.domainId} 
          onChange={e => setFormData({ ...formData, domainId: e.target.value })} 
          required
        >
          <option value="">Select Domain</option>
          {Object.values(domains).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div style={{position:'relative'}}>
            <input
              className="w-full bg-zinc-900 border border-zinc-800
                rounded-lg px-3 py-2 text-sm text-zinc-200
                focus:outline-none focus:border-emerald-500"
              placeholder="Search source entity..."
              value={sourceSearch}
              onChange={e => {
                setSourceSearch(e.target.value)
                setShowSource(true)
                setFormData({...formData, sourceId: ''})
              }}
              onFocus={() => setShowSource(true)}
              onBlur={() => setTimeout(() => setShowSource(false), 150)}
            />
            {showSource && sourceSearch && (
              <div className="absolute top-full left-0 right-0 z-50
                bg-zinc-900 border border-zinc-700 rounded-lg
                max-h-40 overflow-y-auto mt-1">
                {entityOptions
                  .filter(e => e.label.toLowerCase()
                    .includes(sourceSearch.toLowerCase()))
                  .slice(0, 8)
                  .map(e => (
                    <div key={e.id}
                      className="px-3 py-2 cursor-pointer
                        hover:bg-zinc-800 flex items-center
                        justify-between"
                      onMouseDown={() => {
                        setFormData({...formData, sourceId: e.id})
                        setSourceSearch(e.label)
                        setShowSource(false)
                      }}>
                      <span className="text-sm text-zinc-200">
                        {e.label}
                      </span>
                      <span className="text-xs text-zinc-500 ml-2">
                        {e.entity_type}
                      </span>
                    </div>
                  ))
                }
                {entityOptions.filter(e =>
                  e.label.toLowerCase()
                    .includes(sourceSearch.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-xs text-zinc-600">
                    No entities found
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{position:'relative'}}>
            <input
              className="w-full bg-zinc-900 border border-zinc-800
                rounded-lg px-3 py-2 text-sm text-zinc-200
                focus:outline-none focus:border-emerald-500"
              placeholder="Search target entity..."
              value={targetSearch}
              onChange={e => {
                setTargetSearch(e.target.value)
                setShowTarget(true)
                setFormData({...formData, targetId: ''})
              }}
              onFocus={() => setShowTarget(true)}
              onBlur={() => setTimeout(() => setShowTarget(false), 150)}
            />
            {showTarget && targetSearch && (
              <div className="absolute top-full left-0 right-0 z-50
                bg-zinc-900 border border-zinc-700 rounded-lg
                max-h-40 overflow-y-auto mt-1">
                {entityOptions
                  .filter(e => e.label.toLowerCase()
                    .includes(targetSearch.toLowerCase()))
                  .slice(0, 8)
                  .map(e => (
                    <div key={e.id}
                      className="px-3 py-2 cursor-pointer
                        hover:bg-zinc-800 flex items-center
                        justify-between"
                      onMouseDown={() => {
                        setFormData({...formData, targetId: e.id})
                        setTargetSearch(e.label)
                        setShowTarget(false)
                      }}>
                      <span className="text-sm text-zinc-200">
                        {e.label}
                      </span>
                      <span className="text-xs text-zinc-500 ml-2">
                        {e.entity_type}
                      </span>
                    </div>
                  ))
                }
                {entityOptions.filter(e =>
                  e.label.toLowerCase()
                    .includes(targetSearch.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-xs text-zinc-600">
                    No entities found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Relation Type Chips */}
        {knownTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {knownTypes.map(t => (
              <button
                key={t.type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: t.type }))}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                  formData.type === t.type
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : t.in_charter
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-500/70 hover:border-amber-500/40'
                }`}
              >
                {t.type}
                <span className="opacity-50">{t.count}</span>
                {t.in_charter && <span className="text-[8px] bg-emerald-500/20 px-1 rounded text-emerald-500">charter</span>}
                {!t.in_charter && <span title="Not in charter">⚠</span>}
              </button>
            ))}
          </div>
        )}

        <input 
          type="text" 
          placeholder="Select above or type new relation type..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" 
          value={formData.type} 
          onChange={e => setFormData({ ...formData, type: e.target.value })} 
          required 
        />

        {/* Direction Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, directionality: 'directed' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
              formData.directionality === 'directed'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" /> Directed
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, directionality: 'bidirectional' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
              formData.directionality === 'bidirectional'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Bidirectional
          </button>
        </div>

        <textarea 
          placeholder="What evidence supports this relation?" 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[60px]" 
          value={formData.justification} 
          onChange={e => setFormData({ ...formData, justification: e.target.value })} 
          required 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Relation'}
      </button>
    </form>
  );
};
