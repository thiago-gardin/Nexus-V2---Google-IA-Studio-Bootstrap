import React, { useState } from 'react';
import { useNexusStore } from '../../store';
import { Database, Plus } from 'lucide-react';
import { Provenance } from '../../types';

interface EntityFormProps {
  onSuccess?: () => void;
}

export const EntityForm: React.FC<EntityFormProps> = ({ onSuccess }) => {
  const { domains, createLocalEntity } = useNexusStore();
  const [formData, setFormData] = useState({ domainId: '', label: '', type: '', justification: '' });
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [dynamicFields, setDynamicFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!formData.domainId) {
      setActiveVersion(null);
      setDynamicFields([]);
      return;
    }

    fetch(`/api/domains/${formData.domainId}/active-version`)
      .then(res => res.ok ? res.json() : null)
      .then(version => {
        setActiveVersion(version);
        if (version?.schema_json?.allowed_entity_types?.length > 0) {
          setFormData(prev => ({ ...prev, type: version.schema_json.allowed_entity_types[0] }));
        } else {
          setFormData(prev => ({ ...prev, type: '' }));
        }
      });
  }, [formData.domainId]);

  React.useEffect(() => {
    const requiredFields = activeVersion?.schema_json?.required_fields_by_type?.[formData.type] || [];
    setDynamicFields(requiredFields);
    // Initialize attributes with empty strings for required fields
    const newAttrs: Record<string, any> = {};
    requiredFields.forEach((f: string) => {
      newAttrs[f] = attributes[f] || '';
    });
    setAttributes(newAttrs);
  }, [formData.type, activeVersion]);

  const allowedEntityTypes = activeVersion?.schema_json?.allowed_entity_types || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const actor: Provenance = { actor_id: 'human_admin', actor_type: 'human', performed_via: 'Cockpit UI' };
    try {
      await createLocalEntity(
        { 
          domain_id: formData.domainId,
          entity_type: formData.type,
          label: formData.label,
          attributes: attributes,
          provenance: actor
        },
        formData.justification
      );
      setFormData({ domainId: '', label: '', type: '', justification: '' });
      setAttributes({});
      onSuccess?.();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        <Database className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">New Entity</span>
      </div>
      
      <div className="space-y-3">
        <select 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" 
          value={formData.domainId} 
          onChange={e => setFormData({ ...formData, domainId: e.target.value })} 
          required
        >
          <option value="">Select Domain</option>
          {Object.values(domains || {}).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {formData.domainId && !activeVersion && (
          <div className="text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1">
            No active charter · any type accepted
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {allowedEntityTypes.length > 0 ? (
            <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" 
              value={formData.type} 
              onChange={e => setFormData({ ...formData, type: e.target.value })} 
              required
            >
              <option value="">Select Type</option>
              {allowedEntityTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          ) : (
            <input 
              type="text" 
              placeholder="Type a new entity type..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" 
              value={formData.type} 
              onChange={e => setFormData({ ...formData, type: e.target.value })} 
              required 
            />
          )}
          <input 
            type="text" 
            placeholder="Label" 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" 
            value={formData.label} 
            onChange={e => setFormData({ ...formData, label: e.target.value })} 
            required 
          />
        </div>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-zinc-800/50">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Required Attributes</p>
            {dynamicFields.map(field => (
              <div key={field} className="space-y-1">
                <label className="text-[10px] text-zinc-400 ml-1">{field}</label>
                <input
                  type="text"
                  value={attributes[field] || ''}
                  onChange={e => setAttributes({...attributes, [field]: e.target.value})}
                  placeholder={`Enter ${field}...`}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            ))}
          </div>
        )}

        <textarea 
          placeholder="Why is this entity being recorded?" 
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
        <Plus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Entity'}
      </button>
    </form>
  );
};
