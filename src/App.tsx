import React, { useState, useEffect, useMemo } from 'react';
import { ActionPanel } from './components/ActionPanel';
import { EntityList } from './components/EntityList';
import { EventLog } from './components/EventLog';
import { DomainExplorer } from './components/DomainExplorer';
import { RelationExplorer } from './components/RelationExplorer';
import { GraphExplorer } from './components/GraphExplorer';
import { GovernanceExplorer } from './components/GovernanceExplorer';
import { PulseSurface } from './components/PulseSurface';
import { 
  BrainCircuit, Database, Network, Activity, Globe, 
  LayoutDashboard, Share2, ShieldAlert, Plus, X 
} from 'lucide-react';
import { useNexusStore } from './store';
import { formatDistanceToNow } from 'date-fns';
import { SearchPanel } from './components/SearchPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'entities' | 'relations' | 'events' | 'graph' | 'governance'>('overview');
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [prefillRelation, setPrefillRelation] = useState<{sourceId: string, sourceLabel: string} | null>(null)
  const { fetchState, events, localEntities, conflictCases } = useNexusStore();

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const metrics = useMemo(() => {
    const entityList = Object.values(localEntities || {});
    const openConflicts = Object.values(conflictCases || {}).filter(c => c.status === 'open');
    const proposedEntities = entityList.filter(e => e.validation_status === 'proposed');

    return {
      proposed: proposedEntities.length,
      conflicts: openConflicts.length,
    };
  }, [localEntities, conflictCases]);

  const systemHealth = useMemo(() => {
    if (metrics.conflicts >= 3) return { label: 'Critical', color: 'bg-red-500' };
    if (metrics.proposed > 0 || metrics.conflicts > 0) return { label: 'Attention', color: 'bg-amber-500' };
    return { label: 'Healthy', color: 'bg-emerald-500' };
  }, [metrics]);

  const lastEventTime = events[0] ? formatDistanceToNow(new Date(events[0].timestamp)) : null;

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'entities', label: 'Entities', icon: Database },
    { id: 'relations', label: 'Relations', icon: Network },
    { id: 'graph', label: 'Graph View', icon: Share2 },
    { id: 'governance', label: 'Governance', icon: ShieldAlert },
    { id: 'events', label: 'Audit Trail', icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <BrainCircuit className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Nexus Cognitive Memory</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-zinc-500 font-mono">Cockpit Interface v0.1</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-bold uppercase tracking-wider">Phase 1: Core</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${systemHealth.color} animate-pulse`}></span>
                {systemHealth.label}
              </span>
              {lastEventTime && (
                <span className="text-zinc-600">
                  Last event {lastEventTime} ago
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 border-l border-zinc-800 pl-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              System Online
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1600px] w-full mx-auto overflow-hidden relative">
        {/* Sidebar - Palantir Style (48px) */}
        <aside className="w-12 border-r border-zinc-800 bg-zinc-950/30 flex flex-col items-center py-4 gap-4 shrink-0 z-40">
          {sidebarItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`p-2.5 rounded-lg transition-all group relative ${
                activeTab === item.id 
                  ? 'bg-zinc-800 text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-full" />}
            </button>
          ))}
          
          <div className="mt-auto">
            <button 
              onClick={() => setIsActionPanelOpen(true)}
              title="Quick Action"
              className="p-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Action Panel Overlay */}
        {isActionPanelOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" 
              onClick={() => setIsActionPanelOpen(false)} 
            />
            <div className="fixed left-12 top-16 bottom-0 w-[320px] bg-zinc-950 border-r border-zinc-800 z-[70] animate-in slide-in-from-left duration-300 shadow-2xl">
              <ActionPanel 
                onClose={() => setIsActionPanelOpen(false)} 
                prefillRelation={prefillRelation}
                onPrefillUsed={() => setPrefillRelation(null)}
              />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {activeTab === 'overview' ? (
            <PulseSurface setActiveTab={setActiveTab} />
          ) : activeTab === 'graph' ? (
            <div className="flex-1 h-full overflow-hidden p-6">
              <GraphExplorer 
                fullWidth 
                onOpenRelationForm={(sourceId, sourceLabel) => {
                  setPrefillRelation({sourceId, sourceLabel})
                  setIsActionPanelOpen(true)
                }}
              />
            </div>
          ) : (
            <div className="flex-1 h-full overflow-hidden p-6">
              {activeTab === 'domains' && <DomainExplorer fullWidth />}
              {activeTab === 'entities' && <EntityList fullWidth />}
              {activeTab === 'events' && <EventLog fullWidth />}
              {activeTab === 'relations' && <RelationExplorer fullWidth />}
              {activeTab === 'governance' && <GovernanceExplorer fullWidth />}
            </div>
          )}
        </main>
      </div>
      <SearchPanel />
    </div>
  );
}
