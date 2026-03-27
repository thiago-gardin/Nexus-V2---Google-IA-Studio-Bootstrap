import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNexusStore } from '../store';
import { GraphView } from './GraphView';
import { GraphControlPanel } from './graph/GraphControlPanel';
import { GraphToolbar } from './graph/GraphToolbar';
import { GraphHeader } from './graph/GraphHeader';
import { InspectionPanel } from './graph/InspectionPanel';
import { EventStream } from './graph/EventStream';
import { useGraphData } from '../hooks/useGraphData';
import { useValidateObject, useRejectObject, useOpenConflict } from '../hooks/useMutations';
import { PHYSICS_DEFAULTS, SURFACE_DEFAULTS, getDomainColor } from '../config/cockpit.config';

export const GraphExplorer: React.FC<{ fullWidth?: boolean, onOpenRelationForm?: (sourceId: string, sourceLabel: string) => void }> = ({ fullWidth, onOpenRelationForm }) => {
  const store = useNexusStore();
  const { domains, localEntities, relationAssertions } = store;
  
  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [depth, setDepth] = useState<number>(SURFACE_DEFAULTS.graphDepth);
  const [fullDomain, setFullDomain] = useState(false);
  const [multiDomainMode, setMultiDomainMode] = useState(false);
  const [activeDomainIds, setActiveDomainIds] = useState<string[]>([]);
  const [availableDomainsList, setAvailableDomainsList] = useState<{id:string, name:string, slug:string}[]>([]);
  const [physics, setPhysics] = useState(PHYSICS_DEFAULTS);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomTrigger, setZoomTrigger] = useState<{ type: 'in' | 'out' | 'fit' | null }>({ type: null });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{entity: any, x: number, y: number} | null>(null)
  const [showProposedOnly, setShowProposedOnly] = useState(false);
  const [activeEntityTypes, setActiveEntityTypes] = useState<string[]>([]);
  const [activeRelationTypes, setActiveRelationTypes] = useState<string[]>([]);

  const [colorMode, setColorMode] = useState<'by_type' | 'by_domain' | 'by_status'>('by_type');
  const [sizeMode, setSizeMode] = useState<'uniform' | 'by_type' | 'by_degree' | 'by_confidence'>('uniform');
  const [showLabels, setShowLabels] = useState(true);
  const [labelMinZoom, setLabelMinZoom] = useState(1);
  const [clusterByDomain, setClusterByDomain] = useState(false);
  const [crossDomainMode, setCrossDomainMode] = useState<'show_all' | 'proposed_only' | 'hide'>('show_all');
  const [crossDomainOnly, setCrossDomainOnly] = useState(false);
  const [domainColorBorders, setDomainColorBorders] = useState(false);

  const validate = useValidateObject();
  const reject = useRejectObject();
  const openConflict = useOpenConflict();

  const { nodes: rawNodes, links: rawLinks, availableDomains: fetchedDomains, loading, refetch } = useGraphData({ 
    entityId: selectedEntityId, domainId: selectedDomainId, depth, fullDomain, fullMultiDomain: multiDomainMode
  });

  useEffect(() => {
    const close = () => setContextMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    if (fetchedDomains.length > 0) {
      setAvailableDomainsList(fetchedDomains);
      if (activeDomainIds.length === 0) {
        setActiveDomainIds(fetchedDomains.map(d => d.id));
      }
    }
  }, [fetchedDomains]);

  const availableEntityTypes = useMemo(() => Array.from(new Set(Object.values(localEntities).map(e => e.entity_type))), [localEntities]);
  const availableRelationTypes = useMemo(() => Array.from(new Set(Object.values(relationAssertions).map(r => r.relation_type))), [relationAssertions]);

  useEffect(() => { if (availableEntityTypes.length > 0 && activeEntityTypes.length === 0) setActiveEntityTypes(availableEntityTypes); }, [availableEntityTypes]);
  useEffect(() => { if (availableRelationTypes.length > 0 && activeRelationTypes.length === 0) setActiveRelationTypes(availableRelationTypes); }, [availableRelationTypes]);

  const filteredData = useMemo(() => {
    let nodes = rawNodes || [];
    let links = rawLinks || [];

    if (availableDomainsList.length > 0) {
      nodes = nodes.filter(n => activeDomainIds.includes(n.domain_id));
      links = links.filter(l => {
        const s = rawNodes.find(n => n.id === (l.source_id || l.source));
        const t = rawNodes.find(n => n.id === (l.target_id || l.target));
        return s && t && activeDomainIds.includes(s.domain_id) && activeDomainIds.includes(t.domain_id);
      });
    }

    nodes = nodes.filter(n => activeEntityTypes.includes(n.entity_type) && (!showProposedOnly || n.validation_status === 'proposed'));
    const nodeIds = new Set(nodes.map(n => n.id));
    links = links.filter(l => 
      nodeIds.has(l.source_id || l.source) && 
      nodeIds.has(l.target_id || l.target) && 
      activeRelationTypes.includes(l.relation_type) && 
      (!showProposedOnly || l.validation_status === 'proposed')
    );

    if (crossDomainOnly) {
      links = links.filter(l => {
        const s = rawNodes.find(n => n.id === (l.source_id || l.source));
        const t = rawNodes.find(n => n.id === (l.target_id || l.target));
        return s && t && s.domain_id !== t.domain_id;
      });
      const linkedNodeIds = new Set();
      links.forEach(l => {
        linkedNodeIds.add(l.source_id || l.source);
        linkedNodeIds.add(l.target_id || l.target);
      });
      nodes = nodes.filter(n => linkedNodeIds.has(n.id));
    }

    if (crossDomainMode === 'hide') {
      links = links.filter(l => {
        const s = rawNodes.find(n => n.id === (l.source_id || l.source));
        const t = rawNodes.find(n => n.id === (l.target_id || l.target));
        return s && t && s.domain_id === t.domain_id;
      });
    } else if (crossDomainMode === 'proposed_only') {
      links = links.filter(l => {
        const s = rawNodes.find(n => n.id === (l.source_id || l.source));
        const t = rawNodes.find(n => n.id === (l.target_id || l.target));
        if (s && t && s.domain_id !== t.domain_id) {
          return l.validation_status === 'proposed';
        }
        return true;
      });
    }

    return { nodes, links };
  }, [rawNodes, rawLinks, activeEntityTypes, activeRelationTypes, showProposedOnly, crossDomainOnly, crossDomainMode, multiDomainMode, activeDomainIds]);

  const domainsMap = useMemo(() => {
    const map: Record<string, any> = { ...domains };
    availableDomainsList.forEach(d => {
      if (!map[d.id]) map[d.id] = d;
    });
    return map;
  }, [domains, availableDomainsList]);

  const handleAction = async (action: 'validate' | 'reject' | 'conflict') => {
    if (!selectedNode) return;
    try {
      if (action === 'validate') await validate('LocalEntity', selectedNode.id, 'Validated via Graph Explorer');
      else if (action === 'reject') await reject('LocalEntity', selectedNode.id, 'Rejected via Graph Explorer');
      else if (action === 'conflict') await openConflict(selectedNode.id, 'LocalEntity', 'Manual', 'Conflict reported via Graph Explorer');
      refetch();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden ${fullWidth ? 'w-full' : ''}`}>
      <GraphHeader 
        domains={domains} localEntities={localEntities} 
        selectedDomainId={selectedDomainId} setSelectedDomainId={(id) => { setSelectedDomainId(id); setMultiDomainMode(false); }} 
        selectedEntityId={selectedEntityId} setSelectedEntityId={setSelectedEntityId}
        depth={depth} setDepth={setDepth} fullDomain={fullDomain} setFullDomain={setFullDomain}
        multiDomainMode={multiDomainMode} setMultiDomainMode={setMultiDomainMode}
        onReset={() => setResetTrigger(t => t + 1)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-zinc-950">
          <GraphControlPanel 
            physics={physics}
            onPhysicsChange={setPhysics}
            activeEntityTypes={activeEntityTypes}
            onEntityTypeToggle={t => setActiveEntityTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
            activeRelationTypes={activeRelationTypes}
            onRelationTypeToggle={t => setActiveRelationTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
            proposedOnly={showProposedOnly}
            onProposedOnlyChange={setShowProposedOnly}
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            sizeMode={sizeMode}
            onSizeModeChange={setSizeMode}
            showLabels={showLabels}
            onShowLabelsChange={setShowLabels}
            labelMinZoom={labelMinZoom}
            onLabelMinZoomChange={setLabelMinZoom}
            activeDomains={activeDomainIds}
            availableDomains={availableDomainsList.map(d => ({ id: d.id, name: d.name, color: getDomainColor(d.slug || '') }))}
            onDomainToggle={(id) => setActiveDomainIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            crossDomainMode={crossDomainMode}
            onCrossDomainModeChange={setCrossDomainMode}
            clusterByDomain={clusterByDomain}
            onClusterByDomainChange={setClusterByDomain}
            crossDomainOnly={crossDomainOnly}
            onCrossDomainOnlyChange={setCrossDomainOnly}
            domainColorBorders={domainColorBorders}
            onDomainColorBordersChange={setDomainColorBorders}
            availableEntityTypes={availableEntityTypes}
            availableRelationTypes={availableRelationTypes}
          />
          <GraphToolbar onZoomIn={() => setZoomTrigger({ type: 'in' })} onZoomOut={() => setZoomTrigger({ type: 'out' })} onFit={() => setZoomTrigger({ type: 'fit' })} onRefresh={refetch} loading={loading} />
          <GraphView 
            nodes={filteredData.nodes} 
            links={filteredData.links} 
            loading={loading} 
            onNodeSelect={setSelectedNode} 
            onEdgeClick={(edge) => {
              setSelectedEdge(edge)
              setSelectedNode(null)
            }}
            physics={physics} 
            resetTrigger={resetTrigger} 
            zoomTrigger={zoomTrigger} 
            onZoomEnd={() => setZoomTrigger({ type: null })}
            onNodeRightClick={(entity, x, y) =>
              setContextMenu({entity, x, y})}
            colorMode={colorMode}
            sizeMode={sizeMode}
            showLabels={showLabels}
            labelMinZoom={labelMinZoom}
            clusterByDomain={clusterByDomain}
            crossDomainMode={crossDomainMode}
            domainColorBorders={domainColorBorders}
            domains={domainsMap}
          />
        </div>

        {selectedNode && <InspectionPanel node={selectedNode} onClose={() => setSelectedNode(null)} onAction={handleAction} />}
        {selectedEdge && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-950
            p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">
                Relation
              </h3>
              <button onClick={() => setSelectedEdge(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>
            <div className="text-xs text-zinc-400 flex flex-col gap-2">
              <p><span className="text-zinc-500">Type:</span> {selectedEdge.label}</p>
              <p><span className="text-zinc-500">Directionality:</span> {selectedEdge.directionality}</p>
              <p><span className="text-zinc-500">Source:</span> {selectedEdge.source.label}</p>
              <p><span className="text-zinc-500">Target:</span> {selectedEdge.target.label}</p>
              <p><span className="text-zinc-500">Confidence:</span> {selectedEdge.confidence}</p>
              <p><span className="text-zinc-500">Status:</span> {selectedEdge.validation_status}</p>
              <p><span className="text-zinc-500">Provenance:</span> {selectedEdge.provenance.actor_id} via {selectedEdge.provenance.performed_via}</p>
            </div>
            {selectedEdge.validation_status === 'proposed' && (
              <div className="flex gap-2">
                <button onClick={async () => {
                  await validate('LocalRelation', selectedEdge.id, 'Validated via Graph Explorer')
                  refetch()
                  setSelectedEdge(null)
                }} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs">Validate</button>
                <button onClick={async () => {
                  await openConflict(selectedEdge.id, 'LocalRelation', 'Manual', 'Conflict reported via Graph Explorer')
                  refetch()
                  setSelectedEdge(null)
                }} className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs">Conflict</button>
              </div>
            )}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            background: '#0a0a0a',
            border: '0.5px solid #27272a',
            borderRadius: 6,
            minWidth: 180,
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-[10px] text-zinc-500
            border-b border-zinc-800 font-mono truncate">
            {contextMenu.entity.label || contextMenu.entity.name}
          </div>

          <div className="py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-xs
                text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
              onClick={() => {
                setSelectedEntityId(contextMenu.entity.id)
                setContextMenu(null)
              }}>
              ⊕ Focus graph here
            </button>

            <button
              className="w-full text-left px-3 py-1.5 text-xs
                text-blue-400 hover:bg-zinc-800 flex items-center gap-2"
              onClick={() => {
                onOpenRelationForm?.(
                  contextMenu.entity.id,
                  contextMenu.entity.label || contextMenu.entity.name
                )
                setContextMenu(null)
              }}>
              → Add relation from here
            </button>

            {contextMenu.entity.validation_status === 'proposed' && (
              <button
                className="w-full text-left px-3 py-1.5 text-xs
                  text-emerald-400 hover:bg-zinc-800 flex items-center gap-2"
                onClick={async () => {
                  await validate('LocalEntity',
                    contextMenu.entity.id,
                    'Validated via graph context menu')
                  setContextMenu(null)
                }}>
                ✓ Validate
              </button>
            )}

            <button
              className="w-full text-left px-3 py-1.5 text-xs
                text-amber-400 hover:bg-zinc-800 flex items-center gap-2"
              onClick={() => {
                openConflict(
                  contextMenu.entity.id,
                  'LocalEntity',
                  'duplicate',
                  'Opened via graph context menu'
                )
                setContextMenu(null)
              }}>
              ⚠ Open conflict
            </button>
          </div>
        </div>
      )}

      <EventStream domainId={selectedDomainId} />
    </div>
  );
};
