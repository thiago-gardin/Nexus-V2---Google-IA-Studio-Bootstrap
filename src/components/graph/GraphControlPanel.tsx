import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings2, ChevronDown, ChevronRight, Filter, Maximize2, 
  Palette, Zap, Activity, Type, Globe, Layers, MousePointer2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhysicsConfig, ENTITY_STYLES } from '../../config/cockpit.config';

interface GraphControlPanelProps {
  physics: PhysicsConfig;
  onPhysicsChange: (p: PhysicsConfig) => void;
  activeEntityTypes: string[];
  onEntityTypeToggle: (type: string) => void;
  activeRelationTypes: string[];
  onRelationTypeToggle: (type: string) => void;
  proposedOnly: boolean;
  onProposedOnlyChange: (v: boolean) => void;
  colorMode: 'by_type' | 'by_domain' | 'by_status';
  onColorModeChange: (m: 'by_type' | 'by_domain' | 'by_status') => void;
  sizeMode: 'uniform' | 'by_type' | 'by_degree' | 'by_confidence';
  onSizeModeChange: (m: 'uniform' | 'by_type' | 'by_degree' | 'by_confidence') => void;
  showLabels: boolean;
  onShowLabelsChange: (v: boolean) => void;
  labelMinZoom: number;
  onLabelMinZoomChange: (v: number) => void;
  activeDomains: string[];
  availableDomains: { id: string; name: string; color: string }[];
  onDomainToggle: (id: string) => void;
  crossDomainMode: 'show_all' | 'proposed_only' | 'hide';
  onCrossDomainModeChange: (m: 'show_all' | 'proposed_only' | 'hide') => void;
  clusterByDomain: boolean;
  onClusterByDomainChange: (v: boolean) => void;
  crossDomainOnly: boolean;
  onCrossDomainOnlyChange: (v: boolean) => void;
  domainColorBorders: boolean;
  onDomainColorBordersChange: (v: boolean) => void;
  availableEntityTypes: string[];
  availableRelationTypes: string[];
}

export const GraphControlPanel: React.FC<GraphControlPanelProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['filter']));
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const toggleSection = (id: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(id)) newSections.delete(id);
    else newSections.add(id);
    setExpandedSections(newSections);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const SectionHeader = ({ id, label, icon: Icon, badge, dotColor }: { id: string; label: string; icon: any; badge?: string; dotColor?: string }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="w-full h-9 px-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors border-b border-zinc-900/50"
    >
      <div className="flex items-center gap-2">
        {expandedSections.has(id) ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />}
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{label}</span>
        {dotColor && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
      </div>
      {badge && <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{badge}</span>}
    </button>
  );

  const crossDomainRelationTypes = ['EQUIVALENT_TO', 'REFERENCES_PROJECT', 'SPONSORS', 'FUNDS'];

  if (!isExpanded) {
    return (
      <div 
        style={{ left: position.x, top: position.y }}
        className="fixed z-50 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
      >
        <button 
          onClick={() => setIsExpanded(true)}
          onMouseDown={handleMouseDown}
          className="w-10 h-10 flex items-center justify-center hover:bg-zinc-900 transition-colors cursor-move"
        >
          <Settings2 className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div 
      style={{ left: position.x, top: position.y }}
      className="fixed z-50 w-[260px] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col max-h-[80vh]"
    >
      {/* Header */}
      <div 
        onMouseDown={handleMouseDown}
        className="h-8 px-3 flex items-center justify-between border-b border-zinc-800 cursor-move bg-zinc-900/30"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Graph Controls</span>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-zinc-600 hover:text-zinc-400">
          <Maximize2 className="w-3 h-3 rotate-45" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* SECTION 1: FILTER */}
        <div className="flex flex-col">
          <SectionHeader id="filter" label="Filter" icon={Filter} badge={`${props.activeEntityTypes.length} Types`} />
          <AnimatePresence>
            {expandedSections.has('filter') && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden bg-zinc-900/20"
              >
                <div className="p-3 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-2">Entity Types</span>
                    <div className="flex flex-wrap gap-1.5">
                      {props.availableEntityTypes.map(type => {
                        const style = ENTITY_STYLES[type] || ENTITY_STYLES.default;
                        const isActive = props.activeEntityTypes.includes(type);
                        return (
                          <button
                            key={type}
                            onClick={() => props.onEntityTypeToggle(type)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all border ${
                              isActive 
                                ? 'text-white border-transparent' 
                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                            }`}
                            style={isActive ? { backgroundColor: style.bg } : {}}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-2">Relation Types</span>
                    <div className="flex flex-wrap gap-1.5">
                      {props.availableRelationTypes.map(type => {
                        const isActive = props.activeRelationTypes.includes(type);
                        const isCross = crossDomainRelationTypes.includes(type);
                        return (
                          <button
                            key={type}
                            onClick={() => props.onRelationTypeToggle(type)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all border flex items-center gap-1 ${
                              isActive 
                                ? 'bg-zinc-100 text-zinc-900 border-transparent' 
                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                            }`}
                          >
                            {type}
                            {isCross && <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Proposed only</span>
                      <input 
                        type="checkbox" 
                        checked={props.proposedOnly} 
                        onChange={(e) => props.onProposedOnlyChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Cross-domain only</span>
                      <input 
                        type="checkbox" 
                        checked={props.crossDomainOnly} 
                        onChange={(e) => props.onCrossDomainOnlyChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-amber-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3" />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 2: SIZE */}
        <div className="flex flex-col">
          <SectionHeader id="size" label="Size" icon={Maximize2} badge={props.sizeMode.replace('_', ' ')} />
          <AnimatePresence>
            {expandedSections.has('size') && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden bg-zinc-900/20"
              >
                <div className="p-3 space-y-4">
                  <div className="grid grid-cols-2 gap-1">
                    {(['uniform', 'by_type', 'by_degree', 'by_confidence'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => props.onSizeModeChange(m)}
                        className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                          props.sizeMode === m 
                            ? 'bg-zinc-100 text-zinc-900 border-transparent' 
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        {m.replace('by_', '')}
                      </button>
                    ))}
                  </div>
                  {(props.sizeMode === 'by_degree' || props.sizeMode === 'by_confidence') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase">
                        <span>Min/Max Scale</span>
                        <span>12px - 32px</span>
                      </div>
                      <input type="range" disabled className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-not-allowed" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 3: COLOR */}
        <div className="flex flex-col">
          <SectionHeader id="color" label="Color" icon={Palette} badge={props.colorMode.replace('_', ' ')} />
          <AnimatePresence>
            {expandedSections.has('color') && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden bg-zinc-900/20"
              >
                <div className="p-3 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-2">Node Color</span>
                    <div className="grid grid-cols-2 gap-1">
                      {(['uniform', 'by_type', 'by_domain', 'by_status'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => props.onColorModeChange(m)}
                          className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                            props.colorMode === m 
                              ? 'bg-zinc-100 text-zinc-900 border-transparent' 
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          {m.replace('by_', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-2">Edge Color</span>
                    <div className="grid grid-cols-2 gap-1">
                      {['by_type', 'by_domain', 'highlight_cross'].map(m => (
                        <button
                          key={m}
                          className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600`}
                        >
                          {m.replace('by_', '').replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 4: PHYSICS */}
        <div className="flex flex-col">
          <SectionHeader id="physics" label="Physics" icon={Activity} />
          <AnimatePresence>
            {expandedSections.has('physics') && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden bg-zinc-900/20"
              >
                <div className="p-3 space-y-4">
                  {[
                    { label: 'Link distance', key: 'linkDistance', min: 50, max: 300, step: 1 },
                    { label: 'Repulsion', key: 'chargeStrength', min: -500, max: -50, step: 1 },
                    { label: 'Gravity', key: 'gravity', min: 0, max: 0.5, step: 0.01 },
                    { label: 'Collision', key: 'collisionRadius', min: 20, max: 80, step: 1 },
                    { label: 'Alpha decay', key: 'alphaDecay', min: 0.01, max: 0.1, step: 0.005 },
                    { label: 'Vel. decay', key: 'velocityDecay', min: 0.1, max: 0.9, step: 0.05 },
                  ].map(s => (
                    <div key={s.key} className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase">
                        <span>{s.label}</span>
                        <span className="text-zinc-300">{(props.physics as any)[s.key]}</span>
                      </div>
                      <input 
                        type="range" 
                        min={s.min} max={s.max} step={s.step}
                        value={(props.physics as any)[s.key]}
                        onChange={(e) => props.onPhysicsChange({ ...props.physics, [s.key]: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 5: LABELS */}
        <div className="flex flex-col">
          <SectionHeader id="labels" label="Labels" icon={Type} badge={props.showLabels ? 'ON' : 'OFF'} />
          <AnimatePresence>
            {expandedSections.has('labels') && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden bg-zinc-900/20"
              >
                <div className="p-3 space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Show node labels</span>
                      <input 
                        type="checkbox" 
                        checked={props.showLabels} 
                        onChange={(e) => props.onShowLabelsChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Show edge labels</span>
                      <input type="checkbox" disabled className="sr-only peer" />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-zinc-700 after:rounded-full after:h-3 after:w-3 after:transition-all cursor-not-allowed" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Truncate at 16 chars</span>
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3" />
                    </label>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-zinc-900">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase">
                        <span>Label size</span>
                        <span className="text-zinc-300">10px</span>
                      </div>
                      <input type="range" min="8" max="14" defaultValue="10" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase">
                        <span>Min zoom to show</span>
                        <span className="text-zinc-300">{props.labelMinZoom}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="8" step="0.5"
                        value={props.labelMinZoom}
                        onChange={(e) => props.onLabelMinZoomChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 6: SCOPE */}
        <div className="flex flex-col">
          <SectionHeader id="scope" label="Scope" icon={Globe} badge={`${props.activeDomains.length} Domains`} />
          <AnimatePresence>
            {expandedSections.has('scope') && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden bg-zinc-900/20"
              >
                <div className="p-3 space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-2">Domains Visible</span>
                    <div className="flex flex-wrap gap-1.5">
                      {props.availableDomains.map(dom => {
                        const isActive = props.activeDomains.includes(dom.id);
                        return (
                          <button
                            key={dom.id}
                            onClick={() => props.onDomainToggle(dom.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all border ${
                              isActive 
                                ? 'text-white border-transparent' 
                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                            }`}
                            style={isActive ? { backgroundColor: dom.color } : {}}
                          >
                            {dom.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider block mb-2">Cross-domain edges</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['show_all', 'proposed_only', 'hide'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => props.onCrossDomainModeChange(m)}
                          className={`px-2 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                            props.crossDomainMode === m 
                              ? 'bg-emerald-500 text-white border-transparent' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:text-zinc-200'
                          }`}
                        >
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Cluster by domain</span>
                      <input 
                        type="checkbox" 
                        checked={props.clusterByDomain} 
                        onChange={(e) => props.onClusterByDomainChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-indigo-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Domain color borders</span>
                      <input 
                        type="checkbox" 
                        checked={props.domainColorBorders} 
                        onChange={(e) => props.onDomainColorBordersChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-checked:bg-emerald-600 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3" />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
