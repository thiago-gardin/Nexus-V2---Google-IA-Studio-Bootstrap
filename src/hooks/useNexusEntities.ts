import { useMemo } from 'react';
import { useNexusStore } from '../store';
import { LocalEntity, ValidationStatus } from '../types';

interface UseNexusEntitiesProps {
  domainId?: string;
  entityType?: string;
  validationStatus?: ValidationStatus;
}

export function useNexusEntities({ domainId, entityType, validationStatus }: UseNexusEntitiesProps = {}) {
  const localEntities = useNexusStore((state) => state.localEntities);
  const loading = useNexusStore((state) => state.loading);

  const entities = useMemo(() => {
    let list = Object.values(localEntities || {});
    if (domainId) list = list.filter((e) => e.domain_id === domainId);
    if (entityType) list = list.filter((e) => e.entity_type === entityType);
    if (validationStatus) list = list.filter((e) => e.validation_status === validationStatus);
    return list;
  }, [localEntities, domainId, entityType, validationStatus]);

  return { entities, loading };
}
