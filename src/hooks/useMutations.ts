import { useNexusStore } from '../store';
import { Provenance } from '../types';

const defaultActor: Provenance = {
  actor_id: 'human_admin',
  actor_type: 'human',
  performed_via: 'Cockpit UI'
};

export function useValidateObject() {
  const validate = useNexusStore((state) => state.validateObject);
  return (objectType: string, objectId: string, reason: string) => 
    validate(objectType, objectId, defaultActor, reason);
}

export function useRejectObject() {
  const reject = useNexusStore((state) => state.rejectObject);
  return (objectType: string, objectId: string, reason: string) => 
    reject(objectType, objectId, defaultActor, reason);
}

export function useOpenConflict() {
  const openConflict = useNexusStore((state) => state.openConflict);
  return (targetId: string, targetType: string, conflictType: string, description: string) => 
    openConflict({ target_object_id: targetId, target_object_type: targetType, conflict_type: conflictType, description }, 'Manual conflict report');
}

export function usePromoteCanonical() {
  const promote = useNexusStore((state) => state.promoteToCanonical);
  return (localEntityId: string, reason: string) => 
    promote(localEntityId, defaultActor, reason);
}
