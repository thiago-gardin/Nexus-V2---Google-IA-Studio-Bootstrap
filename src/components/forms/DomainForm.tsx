import React, { useState } from 'react';
import { useNexusStore } from '../../store';
import { Globe, Plus } from 'lucide-react';
import { Provenance } from '../../types';

interface DomainFormProps {
  onSuccess?: () => void;
}

export const DomainForm: React.FC<DomainFormProps> = ({ onSuccess }) => {
  const { createDomain } = useNexusStore();
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', justification: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const actor: Provenance = { actor_id: 'human_admin', actor_type: 'human', performed_via: 'Cockpit UI' };
    try {
      await createDomain(
        { 
          name: formData.name, 
          slug: formData.slug, 
          description: formData.description,
          provenance: actor,
          confidence: 1.0,
          validation_status: 'proposed'
        },
        formData.justification
      );
      setFormData({ name: '', slug: '', description: '', justification: '' });
      onSuccess?.();
      alert('Domain created successfully!');
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        <Globe className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">New Domain</span>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="Name" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <input type="text" placeholder="Slug" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required />
        </div>
        <textarea placeholder="Description" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[60px]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        <textarea placeholder="Justification (Required)" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[60px]" value={formData.justification} onChange={e => setFormData({ ...formData, justification: e.target.value })} required />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Domain'}
      </button>
    </form>
  );
};
