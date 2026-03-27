import React from 'react';
import { Filter, Network, RotateCcw } from 'lucide-react';
import { Domain, LocalEntity } from '../../types';

interface GraphHeaderProps {
  domains: Record<string, Domain>;
  localEntities: Record<string, LocalEntity>;
  selectedDomainId: string;
  setSelectedDomainId: (id: string) => void;
  selectedEntityId: string;
  setSelectedEntityId: (id: string) => void;
  depth: number;
  setDepth: (d: number) => void;
  fullDomain: boolean;
  setFullDomain: (f: boolean) => void;
  multiDomainMode: boolean;
  setMultiDomainMode: (m: boolean) => void;
  onReset: () => void;
}

export const GraphHeader: React.FC<GraphHeaderProps> = ({
  domains, localEntities, selectedDomainId, setSelectedDomainId, selectedEntityId, setSelectedEntityId,
  depth, setDepth, fullDomain, setFullDomain, multiDomainMode, setMultiDomainMode, onReset,
}) => {
  return (
    <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-3 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Domain</span>
          <select 
            className="bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700 px-2 py-1 focus:outline-none focus:border-emerald-500" 
            value={multiDomainMode ? 'all' : selectedDomainId} 
            onChange={(e) => { 
              if (e.target.value === 'all') {
                setMultiDomainMode(true);
                setSelectedDomainId('');
                setSelectedEntityId('');
                setFullDomain(false);
              } else {
                setSelectedDomainId(e.target.value); 
                setSelectedEntityId(''); 
                setFullDomain(false); 
                setMultiDomainMode(false); 
              }
            }}
          >
            <option value="" disabled>Select Domain</option>
            <option value="all">All Domains (Multi-domain)</option>
            {(Object.values(domains || {}) as Domain[]).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Focus</span>
          <select className="bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700 px-2 py-1 focus:outline-none focus:border-emerald-500 max-w-[150px]" value={selectedEntityId} onChange={(e) => { setSelectedEntityId(e.target.value); setFullDomain(false); setMultiDomainMode(false); }} disabled={!selectedDomainId || multiDomainMode}>
            <option value="">Select Entity</option>
            {(Object.values(localEntities || {}) as LocalEntity[]).filter(e => e.domain_id === selectedDomainId).map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Depth</span>
          <input type="number" min="1" max="5" className="bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700 px-2 py-1 w-12 focus:outline-none focus:border-emerald-500" value={depth} onChange={(e) => setDepth(parseInt(e.target.value) || 1)} disabled={fullDomain || multiDomainMode} />
        </div>
        <div className="h-4 w-px bg-zinc-800 mx-1" />
        <div className="flex items-center gap-2">
          <button onClick={() => { setFullDomain(true); setSelectedEntityId(''); setMultiDomainMode(false); }} disabled={!selectedDomainId || multiDomainMode} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${fullDomain && !multiDomainMode ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}>Load Full Domain</button>
        </div>
        <button onClick={onReset} className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors" title="Reset View"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
};
