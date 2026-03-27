import React from 'react';
import { X, Shield, CheckCircle, Info, User, Clock, Globe, Database, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ENTITY_STYLES } from '../../config/cockpit.config';

interface InspectionPanelProps {
  node: any;
  onClose: () => void;
  onAction: (action: 'validate' | 'reject' | 'conflict') => void;
}

export const InspectionPanel: React.FC<InspectionPanelProps> = ({ node, onClose, onAction }) => {
  const style = ENTITY_STYLES[node.entity_type] || ENTITY_STYLES.default;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100%-2rem)]">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: style.bg + '20' }}>
            <Database className="w-4 h-4" style={{ color: style.bg }} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">{node.label}</h3>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{node.entity_type}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <span className="text-[8px] font-bold text-zinc-600 uppercase block mb-1">Status</span>
            <div className="flex items-center gap-1.5">
              {node.validation_status === 'canonical' || node.validation_status === 'validated' ? 
                <CheckCircle className="w-3 h-3 text-emerald-500" /> : 
                <Shield className="w-3 h-3 text-amber-500" />
              }
              <span className="text-[10px] font-bold text-zinc-200 uppercase">{node.validation_status}</span>
            </div>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <span className="text-[8px] font-bold text-zinc-600 uppercase block mb-1">Confidence</span>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${node.confidence * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono text-emerald-500">{(node.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Info className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Provenance</span>
          </div>
          <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-400">{node.provenance?.actor_id}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded uppercase font-bold">
                {node.provenance?.actor_type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-500">
                {formatDistanceToNow(new Date(node.provenance?.timestamp || Date.now()))} ago
              </span>
            </div>
          </div>
        </div>

        {node.incidentLinks && node.incidentLinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Globe className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Relations ({node.incidentLinks.length})</span>
            </div>
            <div className="space-y-1.5">
              {node.incidentLinks.map((link: any, idx: number) => {
                const isSource = link.source.id === node.id;
                const neighbor = isSource ? link.target : link.source;
                return (
                  <div key={idx} className="p-2.5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (ENTITY_STYLES[neighbor.entity_type] || ENTITY_STYLES.default).bg }} />
                      <span className="text-[10px] text-zinc-300 font-medium">{neighbor.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">{link.relation_type}</span>
                      <ArrowRight className={`w-3 h-3 text-zinc-700 ${!isSource ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 space-y-2">
        {node.validation_status === 'proposed' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onAction('validate')} className="py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/30 rounded text-[10px] font-bold uppercase transition-all">Validate</button>
            <button onClick={() => onAction('reject')} className="py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 rounded text-[10px] font-bold uppercase transition-all">Reject</button>
          </div>
        )}
        <button onClick={() => onAction('conflict')} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-[10px] font-bold uppercase transition-all">Open Conflict</button>
      </div>
    </div>
  );
};
