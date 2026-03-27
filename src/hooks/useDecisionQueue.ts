import { useMemo } from 'react';
import { useNexusStore } from '../store';
import { DECISION_QUEUE_RULES, THRESHOLDS } from '../config/cockpit.config';

export interface DecisionQueueItem {
  id: string;
  label: string;
  count: number;
  priority: number;
  targetTab: string;
  urgent: boolean;
}

export function useDecisionQueue() {
  const store = useNexusStore();
  const { localEntities, conflictCases, domains } = store;

  const queue = useMemo(() => {
    const items: DecisionQueueItem[] = [];
    const now = new Date().getTime();

    DECISION_QUEUE_RULES.forEach(rule => {
      if (rule.condition(store)) {
        let count = 0;
        let urgent = false;

        if (rule.id === 'conflicts') {
          const openConflicts = Object.values(conflictCases || {}).filter((c: any) => c.status === 'open');
          count = openConflicts.length;
          urgent = openConflicts.some((c: any) => (now - new Date(c.created_at).getTime()) > THRESHOLDS.CONFLICT_STALE);
        } else if (rule.id === 'proposed') {
          const proposed = Object.values(localEntities || {}).filter((e: any) => e.validation_status === 'proposed');
          count = proposed.length;
          urgent = proposed.some((e: any) => (now - new Date(e.created_at).getTime()) > THRESHOLDS.PROPOSED_STALE_CRITICAL);
        } else if (rule.id === 'draft_domains') {
          count = Object.values(domains || {}).filter((d: any) => d.status === 'draft').length;
        }

        items.push({
          id: rule.id,
          label: rule.label,
          count,
          priority: rule.priority,
          targetTab: rule.targetTab,
          urgent
        });
      }
    });

    return items.sort((a, b) => a.priority - b.priority);
  }, [store]);

  return queue;
}
