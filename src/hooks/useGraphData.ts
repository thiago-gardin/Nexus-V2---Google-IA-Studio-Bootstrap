import { useState, useEffect, useCallback } from 'react';

export function useGraphData({ entityId, domainId, depth, fullDomain, fullMultiDomain }: { entityId?: string, domainId?: string, depth: number, fullDomain: boolean, fullMultiDomain?: boolean }) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [availableDomains, setAvailableDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!domainId && !fullMultiDomain) return;
    setLoading(true);
    setError(null);
    try {
      let url = '';
      if (fullMultiDomain) {
        url = '/api/graph/all';
      } else {
        url = `/api/graph?domain_id=${domainId}&depth=${depth}`;
        if (entityId && !fullDomain) url += `&entity_id=${entityId}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch graph data');
      
      const rawData = await res.json();
      setNodes(rawData.nodes || []);
      setLinks(rawData.links || rawData.edges || []);
      if (rawData.domainList) {
        setAvailableDomains(rawData.domainList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [domainId, entityId, depth, fullDomain, fullMultiDomain]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { nodes, links, availableDomains, loading, error, refetch: fetchData };
}
