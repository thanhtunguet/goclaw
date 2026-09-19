import { useCallback, useEffect, useState } from "react";
import { Methods } from "@/api/protocol";
import { useWs } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";

export interface WorkstationPermission {
  id: string;
  workstationId: string;
  pattern: string;
  enabled: boolean;
  createdAt: string;
}

export function useWorkstationPermissions(workstationId: string) {
  const ws = useWs();
  const connected = useAuthStore((s) => s.connected);
  const [permissions, setPermissions] = useState<WorkstationPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!connected || !workstationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await ws.call<{ permissions: WorkstationPermission[] }>(
        Methods.WORKSTATIONS_PERMS_LIST,
        { workstationId },
      );
      setPermissions(response.permissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workstation permissions");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [connected, workstationId, ws]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(async (pattern: string) => {
    await ws.call(Methods.WORKSTATIONS_PERMS_ADD, { workstationId, pattern });
    await load();
  }, [load, workstationId, ws]);

  const remove = useCallback(async (id: string) => {
    await ws.call(Methods.WORKSTATIONS_PERMS_REMOVE, { id });
    await load();
  }, [load, ws]);

  const addBulk = useCallback(async (patterns: string[]) => {
    await ws.call(Methods.WORKSTATIONS_PERMS_ADD_BULK, { workstationId, patterns });
    await load();
  }, [load, workstationId, ws]);

  const removeBulk = useCallback(async (ids: string[]) => {
    await ws.call(Methods.WORKSTATIONS_PERMS_REMOVE_BULK, { ids });
    await load();
  }, [load, ws]);

  const setEnabled = useCallback(async (id: string, enabled: boolean) => {
    await ws.call(Methods.WORKSTATIONS_PERMS_TOGGLE, { id, enabled });
    await load();
  }, [load, ws]);

  return { permissions, loading, error, refresh: load, add, addBulk, remove, removeBulk, setEnabled };
}
