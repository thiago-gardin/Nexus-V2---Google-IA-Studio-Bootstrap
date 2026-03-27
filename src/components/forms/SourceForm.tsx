import React, { useState } from 'react';
import { useNexusStore } from '../../store';
import { Database, Plus } from 'lucide-react';
import { Provenance } from '../../types';

interface SourceFormProps {
  onSuccess?: () => void;
}

export const SourceForm: React.FC<SourceFormProps> = ({ onSuccess }) => {
  const { createSource } = useNexusStore();
  const [formData, setFormData] = useState({ uri: '', sourceType: 'manual', justification: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const actor: Provenance = { actor_id: 'human_admin', actor_type: 'human', performed_via: 'Cockpit UI' };
    try {
      await createSource(
        { 
          uri: formData.uri,
          type: formData.sourceType as any,
          metadata: {},
          provenance: actor
        },
        formData.justification
      );
      setFormData({ uri: '', sourceType: 'manual', justification: '' });
      onSuccess?.();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        <Database className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">New Source</span>
      </div>
      <div className="space-y-3">
        <input type="text" placeholder="URI (e.g., https://example.com)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" value={formData.uri} onChange={e => setFormData({ ...formData, uri: e.target.value })} required />
        <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" value={formData.sourceType} onChange={e => setFormData({ ...formData, sourceType: e.target.value })} required>
          <option value="manual">Manual</option>
          <option value="document">Document</option>
          <option value="api">API</option>
          <option value="agent">Agent</option>
        </select>
        <textarea placeholder="Justification (Required)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[60px]" value={formData.justification} onChange={e => setFormData({ ...formData, justification: e.target.value })} required />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Source'}
      </button>
    </form>
  );
};
