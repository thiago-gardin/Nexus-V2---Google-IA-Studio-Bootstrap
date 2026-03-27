import React, { useState } from 'react';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (conflictType: string, description: string) => Promise<void>;
  targetId: string;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose, onConfirm, targetId }) => {
  const [conflictType, setConflictType] = useState('duplicate');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      await onConfirm(conflictType, description);
      setDescription('');
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Open Conflict</h3>
        <p className="text-sm text-zinc-400 mb-4">Target: <span className="font-mono text-zinc-300">{targetId}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Conflict Type</label>
            <select
              value={conflictType}
              onChange={(e) => setConflictType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="duplicate">Duplicate</option>
              <option value="contradiction">Contradiction</option>
              <option value="schema_violation">Schema Violation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Description (Required)</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none h-24 resize-none"
              placeholder="Describe the conflict..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800"
            >
              {loading ? 'Processing...' : 'Open Conflict'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
