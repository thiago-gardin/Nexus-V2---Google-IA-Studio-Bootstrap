import React, { useState, useMemo } from 'react';
import { useNexusStore } from '../store';
import { Activity, Clock, User, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ACTOR_COLORS } from '../config/cockpit.config';
import { TransformationEvent } from '../types';

export function EventLog({ fullWidth = false }: { fullWidth?: boolean }) {
  const { events, localEntities, domains } = useNexusStore();
  const [filter, setFilter] = useState<'ALL' | 'AGENT' | 'HUMAN'>('ALL');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const narrateEvent = (event: TransformationEvent, entities: Record<string, any>, domainsMap: Record<string, any>) => {
    const entity = entities[event.target_object_id];
    const domain = domainsMap[event.domain_id || ''];
    
    switch (event.event_type) {
      case 'LOCAL_ENTITY_CREATED':
        return `${entity?.entity_type || 'Entidade'} '${entity?.label || '?'}' criada em ${domain?.name || 'domínio desconhecido'}`;
      case 'RELATION_ASSERTION_CREATED':
        return `Relação ${event.payload?.relation_type || 'desconhecida'} criada em ${domain?.name || 'domínio desconhecido'}`;
      case 'OBJECT_VALIDATED':
        return `${entity?.entity_type || 'Objeto'} '${entity?.label || '?'}' validada`;
      case 'OBJECT_REJECTED':
        return `${entity?.entity_type || 'Objeto'} '${entity?.label || '?'}' rejeitada`;
      case 'DOMAIN_CREATED':
        return `Domínio '${domainsMap[event.target_object_id]?.name || 'desconhecido'}' criado`;
      case 'DOMAIN_VERSION_ACTIVATED':
        return `Carta do domínio '${domain?.name || 'desconhecido'}' ativada`;
      case 'CONFLICT_OPENED':
        return `Conflito aberto em '${entity?.label || '?'}'`;
      case 'CANONICAL_PROMOTED':
      case 'PROMOTED_TO_CANONICAL':
        return `Entidade promovida a canônico`;
      default:
        return event.reason;
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) newExpanded.delete(groupId);
    else newExpanded.add(groupId);
    setExpandedGroups(newExpanded);
  };

  const filteredEvents = useMemo(() => {
    const safeEvents = events || [];
    if (filter === 'ALL') return safeEvents;
    return safeEvents.filter(e => e.actor.actor_type === filter.toLowerCase());
  }, [events, filter]);

  const groupedEvents = useMemo(() => {
    const groups: {
      id: string;
      actorId: string;
      actorType: string;
      startTime: string;
      events: TransformationEvent[];
    }[] = [];

    const sorted = [...filteredEvents].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sorted.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && 
          lastGroup.actorId === event.actor.actor_id && 
          Math.abs(new Date(lastGroup.startTime).getTime() - eventTime) < 5 * 60 * 1000) {
        lastGroup.events.push(event);
      } else {
        groups.push({
          id: `${event.actor.actor_id}_${eventTime}`,
          actorId: event.actor.actor_id,
          actorType: event.actor.actor_type,
          startTime: event.timestamp,
          events: [event]
        });
      }
    });

    return groups;
  }, [filteredEvents]);

  const getBadgeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('VALIDATED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (t.includes('REJECTED')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (t.includes('CONFLICT') || t.includes('CANONICAL') || t.includes('PROMOTED')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (t.includes('DOMAIN_')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden ${fullWidth ? 'w-full' : ''}`}>
      {/* Header */}
      <div className="h-14 shrink-0 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Audit Trail
          </h2>
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] font-mono rounded border border-zinc-700">
            {filteredEvents.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['ALL', 'AGENT', 'HUMAN'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === f ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {groupedEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 italic text-sm">
            <Activity className="w-8 h-8 opacity-20" />
            No events found
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {groupedEvents.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              const actorColor = ACTOR_COLORS[group.actorType as keyof typeof ACTOR_COLORS] || ACTOR_COLORS.system;

              return (
                <div key={group.id} className="flex flex-col">
                  {/* Group Header */}
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="h-10 flex items-center px-4 hover:bg-zinc-900/50 transition-colors group"
                  >
                    <div className="w-4 flex justify-center">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />}
                    </div>
                    <div className="w-1 h-4 mx-2 rounded-full" style={{ backgroundColor: actorColor }} />
                    <div className="flex items-center gap-2 flex-1">
                      {group.actorType === 'agent' ? <Bot className="w-3 h-3 text-blue-500" /> : <User className="w-3 h-3 text-zinc-500" />}
                      <span className="text-[11px] font-mono text-zinc-400">{group.actorId}</span>
                      <span className="text-[10px] text-zinc-600">· {formatDistanceToNow(new Date(group.startTime))} ago</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-700 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      {group.events.length}
                    </span>
                  </button>

                  {/* Group Events */}
                  {isExpanded && (
                    <div className="bg-zinc-950/50 divide-y divide-zinc-900/50">
                      {group.events.map(event => (
                        <div key={event.id} className="flex flex-col border-b border-zinc-900/50 last:border-0 group hover:bg-zinc-900/30 transition-colors">
                          <div className="h-10 flex items-center px-12 gap-4">
                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border ${getBadgeColor(event.event_type)}`}>
                              {event.event_type}
                            </div>
                            <div className="flex-1 text-[11px] text-zinc-400 truncate" title={event.reason}>
                              {narrateEvent(event, localEntities, domains)}
                            </div>
                            <div className="w-24 text-[10px] font-mono text-zinc-600 truncate text-right">
                              {event.target_object_id}
                            </div>
                            <div className="w-20 text-[10px] font-mono text-zinc-600 text-right">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {event.before_state_ref && (
                            <div className="h-6 flex items-center px-12 pb-2 -mt-1">
                              <div className="ml-auto flex items-center gap-2 px-2 py-0.5 bg-zinc-950/50 rounded border border-zinc-900/50 font-mono text-[10px]">
                                {(() => {
                                  const before = JSON.parse(event.before_state_ref!);
                                  const after = JSON.parse(event.after_state_ref!);
                                  const getStatusColor = (status: string) => {
                                    if (status === 'validated') return 'text-emerald-400';
                                    if (status === 'rejected') return 'text-red-400';
                                    if (status === 'conflict') return 'text-amber-400';
                                    return 'text-zinc-400';
                                  };
                                  return (
                                    <>
                                      <span className="text-zinc-500">{before.validation_status}</span>
                                      <span className="text-zinc-600">→</span>
                                      <span className={getStatusColor(after.validation_status)}>{after.validation_status}</span>
                                      <span className="text-zinc-800 mx-1">·</span>
                                      <span className="text-zinc-500">v{before.version}</span>
                                      <span className="text-zinc-600">→</span>
                                      <span className="text-zinc-400">v{after.version}</span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
