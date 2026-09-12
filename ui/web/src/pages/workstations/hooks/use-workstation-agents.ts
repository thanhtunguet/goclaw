import { useCallback, useEffect, useState } from "react";
import { useWs } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import { Methods } from "@/api/protocol";

export interface LinkedAgent {
  agentId: string;
  agentKey: string;
  displayName: string;
  isDefault: boolean;
}

export function useWorkstationAgents(workstationId: string) {
  const ws = useWs();
  const connected = useAuthStore((s) => s.connected);
  const [agents, setAgents] = useState<LinkedAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!connected || !workstationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ws.call<{ agents: LinkedAgent[] }>(
        Methods.WORKSTATIONS_LIST_AGENTS,
        { workstationId }
      );
      setAgents(res.agents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load linked agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [ws, connected, workstationId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    agents,
    loading,
    error,
    refresh: load,
  };
}
