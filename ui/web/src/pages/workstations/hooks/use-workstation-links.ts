import { useState, useEffect, useCallback } from "react";
import { useWs, useHttp } from "@/hooks/use-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import { Methods } from "@/api/protocol";
import type { AgentData } from "@/types/agent";
import type { Workstation } from "./use-workstations";

export interface AgentWorkstationLink {
  agentId: string;
  workstationId: string;
  isDefault: boolean;
}

export interface WorkstationInfo {
  id: string;
  workstationKey: string;
  name: string;
  backendType: "ssh" | "docker";
  active: boolean;
}

type LinkParams =
  | { mode: "forWorkstation"; workstationId: string }
  | { mode: "forAgent"; agentId: string };

export function useWorkstationLinks(params: LinkParams) {
  const ws = useWs();
  const http = useHttp();
  const connected = useAuthStore((s) => s.connected);

  const [links, setLinks] = useState<AgentWorkstationLink[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const entityId = params.mode === "forWorkstation" ? params.workstationId : params.agentId;

  const refresh = useCallback(async () => {
    if (!connected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (params.mode === "forWorkstation") {
        // Load all agents for the picker
        try {
          const res = await http.get<{ agents: AgentData[] }>("/v1/agents");
          setAgents(res.agents ?? []);
        } catch (err) {
          console.warn("[useWorkstationLinks] failed to load agents:", err);
        }

        // Load current links for this workstation
        try {
          const res = await ws.call<{ links: AgentWorkstationLink[] }>(
            Methods.WORKSTATIONS_LINKS_FOR_WORKSTATION,
            { workstationId: params.workstationId },
          );
          setLinks(res.links ?? []);
        } catch (e) {
          console.warn("workstation links: failed to load links for workstation", e);
        }
      } else {
        // Load all workstations for the picker
        try {
          const res = await ws.call<{ workstations: Workstation[] }>(
            Methods.WORKSTATIONS_LIST,
          );
          setWorkstations(res.workstations ?? []);
        } catch (err) {
          console.warn("[useWorkstationLinks] failed to load workstations:", err);
        }

        // Load current links for this agent
        try {
          const res = await ws.call<{ links: AgentWorkstationLink[] }>(
            Methods.WORKSTATIONS_LINKS_FOR_AGENT,
            { agentId: params.agentId },
          );
          setLinks(res.links ?? []);
        } catch (e) {
          console.warn("workstation links: failed to load links for agent", e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [connected, http, ws, params.mode, entityId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const linkAgent = useCallback(
    async (agentId: string, workstationId: string, isDefault: boolean) => {
      await ws.call(Methods.WORKSTATIONS_LINK_AGENT, {
        agentId,
        workstationId,
        isDefault,
      });
      await refresh();
    },
    [ws, refresh],
  );

  const unlinkAgent = useCallback(
    async (agentId: string, workstationId: string) => {
      await ws.call(Methods.WORKSTATIONS_UNLINK_AGENT, {
        agentId,
        workstationId,
      });
      await refresh();
    },
    [ws, refresh],
  );

  const setDefault = useCallback(
    async (agentId: string, workstationId: string) => {
      await ws.call(Methods.WORKSTATIONS_LINK_AGENT, {
        agentId,
        workstationId,
        isDefault: true,
      });
      await refresh();
    },
    [ws, refresh],
  );

  return {
    links,
    agents,
    workstations,
    loading,
    refresh,
    linkAgent,
    unlinkAgent,
    setDefault,
  };
}
