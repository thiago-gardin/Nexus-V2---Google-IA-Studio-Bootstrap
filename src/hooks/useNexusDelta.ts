import { useEffect, useState, useMemo } from 'react';
import { useNexusStore } from '../store';
import { LocalEntity, RelationAssertion, TransformationEvent } from '../types';

export function useNexusDelta() {
  const { localEntities, relationAssertions, events } = useNexusStore();
  const [lastVisit, setLastVisit] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('nexus_last_visit');
    setLastVisit(stored);
    localStorage.setItem('nexus_last_visit', new Date().toISOString());
  }, []);

  const delta = useMemo(() => {
    if (!lastVisit) return { newEntities: [], newRelations: [], newEvents: [], byAgent: 0, byHuman: 0 };
    
    const lastVisitDate = new Date(lastVisit);
    
    const newEntities = Object.values(localEntities || {}).filter(e => new Date(e.created_at) > lastVisitDate);
    const newRelations = Object.values(relationAssertions || {}).filter(r => new Date(r.created_at) > lastVisitDate);
    const newEvents = (events || []).filter(e => new Date(e.timestamp) > lastVisitDate);
    
    const byAgent = newEvents.filter(e => e.actor.actor_type === 'agent').length;
    const byHuman = newEvents.filter(e => e.actor.actor_type === 'human').length;

    return { newEntities, newRelations, newEvents, byAgent, byHuman };
  }, [localEntities, relationAssertions, events, lastVisit]);

  return { ...delta, lastVisit };
}
