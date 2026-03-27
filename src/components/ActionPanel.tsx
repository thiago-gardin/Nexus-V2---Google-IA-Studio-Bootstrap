import React, { useState } from 'react';
import { Globe, History, Database, Network, Plus, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { DomainForm } from './forms/DomainForm';
import { DomainVersionForm } from './forms/DomainVersionForm';
import { SourceForm } from './forms/SourceForm';
import { EntityForm } from './forms/EntityForm';
import { RelationForm } from './forms/RelationForm';

interface ActionPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  prefillRelation?: {sourceId: string, sourceLabel: string} | null;
  onPrefillUsed?: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ collapsed, onToggle, onClose, prefillRelation, onPrefillUsed }) => {
  const [activeTab, setActiveTab] = useState<'entity' | 'relation' | 'other'>('entity');
  const [otherSubTab, setOtherSubTab] = useState<'domain' | 'version' | 'source'>('domain');

  React.useEffect(() => {
    if (prefillRelation) {
      setActiveTab('relation');
    }
  }, [prefillRelation]);

  const tabs = [
    { id: 'entity', label: 'Entity', icon: Plus },
    { id: 'relation', label: 'Relation', icon: Network },
    { id: 'other', label: 'Other', icon: Info },
  ] as const;

  const otherTabs = [
    { id: 'domain', label: 'Domain', icon: Globe },
    { id: 'version', label: 'Charter', icon: History },
    { id: 'source', label: 'Source', icon: Database },
  ] as const;

  if (collapsed) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-12 h-full flex flex-col items-center py-4 gap-4">
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
          title="Expand Panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex flex-col gap-4">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => { onToggle?.(); setActiveTab(tab.id); }} 
              className={`p-2 transition-colors ${activeTab === tab.id ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'}`} 
              title={`Create ${tab.label}`}
            >
              <tab.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative">
      {onToggle && (
        <button 
          onClick={onToggle}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-500" />
          Symmetry Panel
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 flex overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border-b-2 transition-all ${
              activeTab === tab.id 
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="text-xs text-zinc-500 mb-6 border-l-2 border-emerald-500/30 pl-3">
          <strong>Art. 11: Human-Agent Symmetry.</strong> Every action must be justified and auditable.
        </div>

        {activeTab === 'entity' && <EntityForm onSuccess={onClose} />}
        {activeTab === 'relation' && <RelationForm onSuccess={onClose} initialSource={prefillRelation} onInitialSourceUsed={onPrefillUsed} />}
        {activeTab === 'other' && (
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              {otherTabs.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setOtherSubTab(sub.id)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                    otherSubTab === sub.id
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            {otherSubTab === 'domain' && <DomainForm onSuccess={onClose} />}
            {otherSubTab === 'version' && <DomainVersionForm onSuccess={onClose} />}
            {otherSubTab === 'source' && <SourceForm onSuccess={onClose} />}
          </div>
        )}
      </div>
    </div>
  );
};
