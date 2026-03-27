import React, { useState } from 'react';
import { useNexusStore } from '../../store';
import { History, Plus } from 'lucide-react';
import { Provenance } from '../../types';

interface DomainVersionFormProps {
  onSuccess?: () => void;
}

export const DomainVersionForm: React.FC<DomainVersionFormProps> = ({ onSuccess }) => {
  const { domains, domainVersions, createDomainVersion, activateDomainVersion } = useNexusStore();
  const [formData, setFormData] = useState({ domainId: '', charter: '', schema: '{\n  "allowed_entity_types": ["Person", "Organization"],\n  "allowed_relation_types": ["WORKS_FOR"],\n  "required_fields_by_type": {\n    "Person": ["name"],\n    "Organization": ["name"]\n  }\n}', justification: '' });
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [relationTypes, setRelationTypes] = useState<string[]>([])
  const [requiredFields, setRequiredFields] =
    useState<Record<string, string[]>>({})
  const [newET, setNewET] = useState('')
  const [newRT, setNewRT] = useState('')
  const [expandedET, setExpandedET] = useState<string|null>(null)
  const [newRF, setNewRF] = useState('')
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const actor: Provenance = { actor_id: 'human_admin', actor_type: 'human', performed_via: 'Cockpit UI' };
    
    const schema_json = {
      allowed_entity_types: entityTypes,
      allowed_relation_types: relationTypes,
      required_fields_by_type: requiredFields
    }

    try {
      const versions = Object.values(domainVersions || {}).filter(v => v.domain_id === formData.domainId);
      const maxVersion = Math.max(...versions.map(v => v.version_number), 0);
      
      const version = await createDomainVersion(
        { 
          domain_id: formData.domainId,
          version_number: maxVersion + 1,
          charter_text: formData.charter,
          schema_json: schema_json,
          provenance: actor,
          confidence: 1.0,
          validation_status: 'proposed'
        },
        formData.justification
      );
      
      if (version && version.id) {
        await activateDomainVersion(version.id, actor, 'Auto-activating new version');
        alert('Domain version created and activated successfully.');
      }
      
      setFormData({ domainId: '', charter: '', justification: '' });
      setEntityTypes([]);
      setRelationTypes([]);
      setRequiredFields({});
      onSuccess?.();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        <History className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">New Domain Version</span>
      </div>
      <div className="space-y-3">
        <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" value={formData.domainId} onChange={e => setFormData({ ...formData, domainId: e.target.value })} required>
          <option value="">Select Domain</option>
          {Object.values(domains || {}).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <textarea placeholder="Charter" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[60px]" value={formData.charter} onChange={e => setFormData({ ...formData, charter: e.target.value })} required />
        
        {/* Entity Types */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-500">Entity types</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {entityTypes.map(t => (
              <span key={t} className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                {t} <button type="button" onClick={() => setEntityTypes(prev => prev.filter(x => x !== t))} className="text-red-500 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input placeholder="Add type... e.g. Project" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200" value={newET} onChange={e => setNewET(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(newET) { setEntityTypes([...entityTypes, newET]); setNewET(''); } } }} />
            <button type="button" onClick={() => { if(newET) { setEntityTypes([...entityTypes, newET]); setNewET(''); } }} className="bg-zinc-800 text-zinc-300 px-3 rounded-lg">+</button>
          </div>
        </div>

        {/* Relation Types */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-500">Relation types</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {relationTypes.map(t => (
              <span key={t} className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                {t} <button type="button" onClick={() => setRelationTypes(prev => prev.filter(x => x !== t))} className="text-red-500 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input placeholder="Add type... e.g. BELONGS_TO" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200" value={newRT} onChange={e => setNewRT(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(newRT) { setRelationTypes([...relationTypes, newRT]); setNewRT(''); } } }} />
            <button type="button" onClick={() => { if(newRT) { setRelationTypes([...relationTypes, newRT]); setNewRT(''); } }} className="bg-zinc-800 text-zinc-300 px-3 rounded-lg">+</button>
          </div>
        </div>

        {/* Required Fields */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-500">Required fields</label>
          {entityTypes.map(et => (
            <div key={et} className="border border-zinc-800 rounded-lg p-2">
              <button type="button" onClick={() => setExpandedET(expandedET === et ? null : et)} className="text-xs text-zinc-300 w-full text-left flex justify-between">
                {et} {expandedET === et ? '▼' : '▶'}
              </button>
              {expandedET === et && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(requiredFields[et] || []).map(rf => (
                      <span key={rf} className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {rf} <button type="button" onClick={() => setRequiredFields({...requiredFields, [et]: requiredFields[et].filter(x => x !== rf)})} className="text-red-500 hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="Add required field... e.g. title" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200" value={newRF} onChange={e => setNewRF(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(newRF) { setRequiredFields({...requiredFields, [et]: [...(requiredFields[et] || []), newRF]}); setNewRF(''); } } }} />
                    <button type="button" onClick={() => { if(newRF) { setRequiredFields({...requiredFields, [et]: [...(requiredFields[et] || []), newRF]}); setNewRF(''); } }} className="bg-zinc-800 text-zinc-300 px-2 rounded-lg">+</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <textarea placeholder="Justification (Required)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[60px]" value={formData.justification} onChange={e => setFormData({ ...formData, justification: e.target.value })} required />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Version'}
      </button>
    </form>
  );
};
