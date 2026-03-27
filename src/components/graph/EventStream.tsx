import React, { useState, useEffect } from 'react';
import { Activity, ChevronRight } from 'lucide-react';
import { TransformationEvent } from '../../types';

interface EventStreamProps {
  domainId?: string;
}

export const EventStream: React.FC<EventStreamProps> = ({ domainId }) => {
  const [events, setEvents] = useState<TransformationEvent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (!domainId) return;
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/events?domain_id=${domainId}&limit=5`);
        if (res.ok) setEvents(await res.json());
      } catch (err) { console.error('Failed to fetch events', err); }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [domainId]);

  return (
    <div className={`shrink-0 border-t border-zinc-800 bg-zinc-900/90 transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-[120px]'}`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full h-8 flex items-center justify-between px-4 hover:bg-zinc-800 transition-colors">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Event Stream</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
      </button>
      {!isCollapsed && (
        <div className="p-3 overflow-y-auto h-[88px] space-y-2 custom-scrollbar">
          {events.length > 0 ? events.map(event => (
            <div key={event.id} className="flex items-center gap-3 text-[10px] font-mono border-b border-zinc-800/50 pb-1 last:border-0">
              <span className="text-zinc-600">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
              <span className="text-emerald-500">{event.actor.actor_id}</span>
              <span className="text-zinc-400">→</span>
              <span className="text-indigo-400">{event.event_type}</span>
              <span className="text-zinc-400">→</span>
              <span className="text-zinc-200 truncate">{event.target_object_id}</span>
            </div>
          )) : <div className="h-full flex items-center justify-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest">No recent events</div>}
        </div>
      )}
    </div>
  );
};
