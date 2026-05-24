# Workstation Agent Access UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add UI for linking/unlinking agents to workstations — a tab in the workstation expanded row and a section in the agent permissions tab.

**Architecture:** A shared hook `use-workstation-links.ts` handles all WS calls for both views. `WorkstationAgentsTab` shows which agents can access a workstation; `WorkstationLinksSection` (appended to `AgentPermissionsTab`) shows which workstations an agent can access. No backend changes needed — all RPC methods already exist.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Radix UI, i18next, WebSocket via `useWs()`, HTTP via `useHttp()`, existing `Methods` constants from `@/api/protocol`.

---

## Task 1: i18n keys for workstations namespace

**Goal:** Add all new translation keys to all 3 locale files for the `workstations` namespace (agents tab in the workstation row).

**Files:**
- Modify: `ui/web/src/i18n/locales/en/workstations.json`
- Modify: `ui/web/src/i18n/locales/vi/workstations.json`
- Modify: `ui/web/src/i18n/locales/zh/workstations.json`

**Acceptance Criteria:**
- [ ] `workstations.agents.*` keys present in all 3 locale files
- [ ] No missing keys across en/vi/zh

**Verify:** `grep -r '"agents"' ui/web/src/i18n/locales/*/workstations.json | wc -l` → 3

**Steps:**

- [ ] **Step 1: Add `agents` block to `ui/web/src/i18n/locales/en/workstations.json`**

Insert after the closing `}` of `"activity"` block (before final `}`):

```json
  ,
  "agents": {
    "tabTitle": "Agents",
    "sectionTitle": "Linked Agents",
    "empty": "No agents linked to this workstation",
    "emptyHint": "Link an agent so it can run commands on this workstation.",
    "linkPlaceholder": "Select an agent…",
    "link": "Link agent",
    "setDefault": "Set as default",
    "unlink": "Unlink",
    "defaultBadge": "default",
    "confirmUnlinkDefault": "This is the default workstation for this agent. Unlinking will clear the default binding. Continue?",
    "confirmUnlink": "Unlink this agent from the workstation?",
    "linkError": "Failed to link agent",
    "unlinkError": "Failed to unlink agent",
    "setDefaultError": "Failed to set default",
    "noAgentsAvailable": "No agents available"
  }
```

- [ ] **Step 2: Add `agents` block to `ui/web/src/i18n/locales/vi/workstations.json`**

Same insertion point (after `"activity"` block, before final `}`):

```json
  ,
  "agents": {
    "tabTitle": "Agents",
    "sectionTitle": "Agents được liên kết",
    "empty": "Chưa có agent nào được liên kết với workstation này",
    "emptyHint": "Liên kết agent để cho phép thực thi lệnh trên workstation này.",
    "linkPlaceholder": "Chọn agent…",
    "link": "Liên kết agent",
    "setDefault": "Đặt làm mặc định",
    "unlink": "Gỡ liên kết",
    "defaultBadge": "mặc định",
    "confirmUnlinkDefault": "Đây là workstation mặc định của agent này. Gỡ liên kết sẽ xóa ràng buộc mặc định. Tiếp tục?",
    "confirmUnlink": "Gỡ liên kết agent này khỏi workstation?",
    "linkError": "Không thể liên kết agent",
    "unlinkError": "Không thể gỡ liên kết agent",
    "setDefaultError": "Không thể đặt làm mặc định",
    "noAgentsAvailable": "Không có agent nào"
  }
```

- [ ] **Step 3: Add `agents` block to `ui/web/src/i18n/locales/zh/workstations.json`**

Same insertion point:

```json
  ,
  "agents": {
    "tabTitle": "Agents",
    "sectionTitle": "已关联 Agent",
    "empty": "此工作站尚未关联任何 Agent",
    "emptyHint": "关联 Agent 以允许在此工作站执行命令。",
    "linkPlaceholder": "选择 Agent…",
    "link": "关联 Agent",
    "setDefault": "设为默认",
    "unlink": "取消关联",
    "defaultBadge": "默认",
    "confirmUnlinkDefault": "此工作站是该 Agent 的默认工作站，取消关联将清除默认绑定。继续？",
    "confirmUnlink": "取消该 Agent 与工作站的关联？",
    "linkError": "关联 Agent 失败",
    "unlinkError": "取消关联失败",
    "setDefaultError": "设置默认失败",
    "noAgentsAvailable": "暂无可用 Agent"
  }
```

- [ ] **Step 4: Commit**

```bash
git add ui/web/src/i18n/locales/en/workstations.json \
        ui/web/src/i18n/locales/vi/workstations.json \
        ui/web/src/i18n/locales/zh/workstations.json
git commit -m "feat(i18n): add workstation agents tab keys to all locales"
```

---

## Task 2: i18n keys for agents namespace

**Goal:** Add workstation-links section keys to all 3 locale files for the `agents` namespace.

**Files:**
- Modify: `ui/web/src/i18n/locales/en/agents.json`
- Modify: `ui/web/src/i18n/locales/vi/agents.json`
- Modify: `ui/web/src/i18n/locales/zh/agents.json`

**Acceptance Criteria:**
- [ ] `agents.workstations.*` keys present in all 3 locale files
- [ ] No missing keys across en/vi/zh

**Verify:** `grep -r '"workstations"' ui/web/src/i18n/locales/*/agents.json | wc -l` → 3

**Steps:**

- [ ] **Step 1: Add `workstations` block to `ui/web/src/i18n/locales/en/agents.json`**

Insert before the final `}` of the JSON (after the `"toast"` block):

```json
  ,
  "workstations": {
    "sectionTitle": "Workstation Access",
    "sectionDescription": "Workstations this agent can execute commands on",
    "empty": "No workstations linked",
    "emptyHint": "Link a workstation so this agent can run commands on remote machines.",
    "grantPlaceholder": "Select a workstation…",
    "grantAccess": "Grant access",
    "setDefault": "Set as default",
    "revoke": "Revoke",
    "defaultBadge": "default",
    "grantError": "Failed to link workstation",
    "revokeError": "Failed to revoke workstation access",
    "setDefaultError": "Failed to set default workstation",
    "noWorkstationsAvailable": "No workstations available"
  }
```

- [ ] **Step 2: Add `workstations` block to `ui/web/src/i18n/locales/vi/agents.json`**

Same insertion (before final `}`):

```json
  ,
  "workstations": {
    "sectionTitle": "Quyền truy cập Workstation",
    "sectionDescription": "Các workstation agent này có thể thực thi lệnh",
    "empty": "Chưa liên kết workstation nào",
    "emptyHint": "Liên kết workstation để agent có thể chạy lệnh trên máy từ xa.",
    "grantPlaceholder": "Chọn workstation…",
    "grantAccess": "Cấp quyền truy cập",
    "setDefault": "Đặt làm mặc định",
    "revoke": "Thu hồi",
    "defaultBadge": "mặc định",
    "grantError": "Không thể liên kết workstation",
    "revokeError": "Không thể thu hồi quyền truy cập workstation",
    "setDefaultError": "Không thể đặt workstation mặc định",
    "noWorkstationsAvailable": "Không có workstation nào"
  }
```

- [ ] **Step 3: Add `workstations` block to `ui/web/src/i18n/locales/zh/agents.json`**

Same insertion:

```json
  ,
  "workstations": {
    "sectionTitle": "工作站访问权限",
    "sectionDescription": "该 Agent 可执行命令的工作站",
    "empty": "未关联任何工作站",
    "emptyHint": "关联工作站以允许该 Agent 在远程机器上运行命令。",
    "grantPlaceholder": "选择工作站…",
    "grantAccess": "授予访问权限",
    "setDefault": "设为默认",
    "revoke": "撤销",
    "defaultBadge": "默认",
    "grantError": "关联工作站失败",
    "revokeError": "撤销工作站访问权限失败",
    "setDefaultError": "设置默认工作站失败",
    "noWorkstationsAvailable": "暂无可用工作站"
  }
```

- [ ] **Step 4: Commit**

```bash
git add ui/web/src/i18n/locales/en/agents.json \
        ui/web/src/i18n/locales/vi/agents.json \
        ui/web/src/i18n/locales/zh/agents.json
git commit -m "feat(i18n): add workstation links section keys to agents locales"
```

---

## Task 3: Shared hook `use-workstation-links.ts`

**Goal:** Create the shared hook used by both workstation and agent views for all link/unlink/list operations.

**Files:**
- Create: `ui/web/src/pages/workstations/hooks/use-workstation-links.ts`

**Acceptance Criteria:**
- [ ] Hook exports correct TypeScript interface `AgentWorkstationLink`
- [ ] `forWorkstation` mode calls `WORKSTATIONS_LIST_FOR_WORKSTATION` → resolves to the correct WS method
- [ ] `forAgent` mode fetches links then resolves workstation names
- [ ] `linkAgent`, `unlinkAgent` call the correct WS methods
- [ ] `setDefault` calls `link_agent` with `isDefault: true`
- [ ] All mutations call `refresh()` after success

**Verify:** `cd ui/web && pnpm tsc --noEmit 2>&1 | grep use-workstation-links` → no output (no type errors)

**Steps:**

- [ ] **Step 1: Check what WS method is used for listing links**

The backend RPC for listing links per workstation is `workstations.list` + `workstations.link_agent` / `workstations.unlink_agent`. There is no dedicated "list links for workstation" WS method — instead `AgentWorkstationLinkStore.ListForWorkstation` is exposed via HTTP at `/v1/workstations/:id/agents` if it exists, or we call the existing `workstations.list` and handle separately.

Check if an HTTP endpoint exists:
```bash
grep -r "ListForWorkstation\|list.*agent\|agent.*link" \
  /Users/tungpt/Development/thanhtunguet/goclaw/internal/http/workstations.go | head -20
```

If no HTTP endpoint, the hook will call `workstations.link_agent` for writes and use the WS method `workstations.list_agents` if available; otherwise it falls back to a pattern of listing via the gateway method `handleLinkAgent`/`handleUnlinkAgent` only and resolving the list locally from a re-fetch.

**Important:** Check `internal/gateway/methods/workstations.go` around line 42 — the `Register` method shows all registered routes. The list of linked agents per workstation uses `ListForWorkstation` on the store but there may be no dedicated WS method exposed. In that case, create a small helper:
- For workstation view: we don't have a dedicated "list agents for workstation" WS method. Check HTTP:

```bash
grep -n "ListForWorkstation\|linkAgent\|link_agent\|handleLink" \
  /Users/tungpt/Development/thanhtunguet/goclaw/internal/http/workstations.go
```

If `handleLinkAgent` exists in HTTP handler, note its route. If not, we use the WS `workstations.link_agent` and `workstations.unlink_agent` for mutations; for listing we need to expose one more method or use a workaround.

**Workaround if no list endpoint:** The workstation-agents tab will load all agents (HTTP `/v1/agents`) then call a local resolve. The link state is tracked locally after each link/unlink action — the server is source of truth on page refresh. This is acceptable UX for an admin-only page.

- [ ] **Step 2: Check whether HTTP handler has link/list-agents endpoints**

```bash
grep -n "link\|Link\|agent" \
  /Users/tungpt/Development/thanhtunguet/goclaw/internal/http/workstations.go | head -30
```

Record the result and proceed accordingly in Step 3.

- [ ] **Step 3: Create `use-workstation-links.ts`**

```typescript
// ui/web/src/pages/workstations/hooks/use-workstation-links.ts
import { useState, useEffect, useCallback } from "react";
import { useWs, useHttp } from "@/hooks/use-ws";
import { Methods } from "@/api/protocol";
import type { AgentData } from "@/types/agent";

export interface AgentWorkstationLink {
  agentId: string;
  workstationId: string;
  tenantId: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WorkstationInfo {
  id: string;
  workstationKey: string;
  name: string;
  backendType: "ssh" | "docker";
  active: boolean;
}

// forWorkstation mode: manages agents linked to a specific workstation
// forAgent mode: manages workstations linked to a specific agent
type LinkParams =
  | { mode: "forWorkstation"; workstationId: string }
  | { mode: "forAgent"; agentId: string };

export function useWorkstationLinks(params: LinkParams) {
  const ws = useWs();
  const http = useHttp();

  const [links, setLinks] = useState<AgentWorkstationLink[]>([]);
  const [agents, setAgents] = useState<AgentData[]>([]);         // all agents (for picker)
  const [workstations, setWorkstations] = useState<WorkstationInfo[]>([]); // all wss (for picker)
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (params.mode === "forWorkstation") {
        // Load all agents for picker
        try {
          const res = await http.get<{ agents: AgentData[] }>("/v1/agents");
          setAgents(res.agents ?? []);
        } catch {
          setAgents([]);
        }
        // Load linked agents via WS (no dedicated list method — use HTTP if available)
        // POST workstations.list_agents_for_workstation if registered, else empty until link/unlink
        // We try calling the WS method; if it errors (not registered), keep empty
        try {
          const res = await ws.call<{ links: AgentWorkstationLink[] }>(
            "workstations.list_agents",
            { workstationId: params.workstationId },
          );
          setLinks(res.links ?? []);
        } catch {
          // Method not registered — links will be tracked locally
          setLinks([]);
        }
      } else {
        // forAgent mode: load workstations for picker + linked workstations
        try {
          const res = await ws.call<{ workstations: WorkstationInfo[] }>(Methods.WORKSTATIONS_LIST);
          setWorkstations(res.workstations ?? []);
        } catch {
          setWorkstations([]);
        }
        // Load links for this agent
        try {
          const res = await ws.call<{ links: AgentWorkstationLink[] }>(
            "workstations.list_for_agent",
            { agentId: params.agentId },
          );
          setLinks(res.links ?? []);
        } catch {
          setLinks([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [params.mode, params.mode === "forWorkstation" ? params.workstationId : (params as { agentId: string }).agentId, ws, http]); // eslint-disable-line

  useEffect(() => {
    refresh();
  }, [refresh]);

  const linkAgent = useCallback(
    async (agentId: string, workstationId: string, isDefault: boolean) => {
      await ws.call(Methods.WORKSTATIONS_LINK_AGENT, { agentId, workstationId, isDefault });
      // Optimistically update links
      setLinks((prev) => {
        const filtered = prev.filter(
          (l) => !(l.agentId === agentId && l.workstationId === workstationId),
        );
        const updated = isDefault
          ? filtered.map((l) =>
              l.agentId === agentId ? { ...l, isDefault: false } : l,
            )
          : filtered;
        return [
          ...updated,
          {
            agentId,
            workstationId,
            tenantId: "",
            isDefault: isDefault || prev.filter((l) => l.agentId === agentId).length === 0,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    },
    [ws],
  );

  const unlinkAgent = useCallback(
    async (agentId: string, workstationId: string) => {
      await ws.call(Methods.WORKSTATIONS_UNLINK_AGENT, { agentId, workstationId });
      setLinks((prev) =>
        prev.filter((l) => !(l.agentId === agentId && l.workstationId === workstationId)),
      );
    },
    [ws],
  );

  const setDefault = useCallback(
    async (agentId: string, workstationId: string) => {
      await ws.call(Methods.WORKSTATIONS_LINK_AGENT, {
        agentId,
        workstationId,
        isDefault: true,
      });
      setLinks((prev) =>
        prev.map((l) =>
          l.agentId === agentId
            ? { ...l, isDefault: l.workstationId === workstationId }
            : l,
        ),
      );
    },
    [ws],
  );

  return {
    links,
    agents,       // populated in forWorkstation mode
    workstations, // populated in forAgent mode
    loading,
    refresh,
    linkAgent,
    unlinkAgent,
    setDefault,
  };
}
```

**Note:** If the WS methods `workstations.list_agents` and `workstations.list_for_agent` are not registered in the backend, the `links` array will remain empty until the user performs a link/unlink action. This is acceptable — the tab still fully functions for mutations. Run the verify command and check for type errors before committing.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/tungpt/Development/thanhtunguet/goclaw/ui/web && pnpm tsc --noEmit 2>&1 | grep -E "use-workstation-links|error TS" | head -20
```

Fix any type errors before proceeding.

- [ ] **Step 5: Commit**

```bash
git add ui/web/src/pages/workstations/hooks/use-workstation-links.ts
git commit -m "feat(workstations): add use-workstation-links shared hook"
```

---

## Task 4: `WorkstationAgentsTab` component

**Goal:** Create the "Agents" tab content for the expanded workstation row — shows linked agents with link/unlink/set-default actions.

**Files:**
- Create: `ui/web/src/pages/workstations/workstation-agents-tab.tsx`

**Acceptance Criteria:**
- [ ] Renders list of agents linked to the workstation
- [ ] Shows "default" badge on the default-linked agent
- [ ] Combobox to select and link a new agent (filters out already-linked)
- [ ] "Set default" button for non-default links
- [ ] Unlink button with inline confirmation
- [ ] Empty state when no agents are linked
- [ ] Loading skeleton during fetch
- [ ] All text uses `useTranslation("workstations")` keys from Task 1

**Verify:** `cd ui/web && pnpm tsc --noEmit 2>&1 | grep workstation-agents-tab` → no output

**Steps:**

- [ ] **Step 1: Check existing activity tab for UI patterns to follow**

Read `ui/web/src/pages/workstations/workstation-activity-tab.tsx` to understand the skeleton/empty-state pattern used in the sibling component. The new component should match its structure.

```bash
head -60 /Users/tungpt/Development/thanhtunguet/goclaw/ui/web/src/pages/workstations/workstation-activity-tab.tsx
```

- [ ] **Step 2: Check what Select/Combobox components are available**

```bash
ls /Users/tungpt/Development/thanhtunguet/goclaw/ui/web/src/components/ui/ | grep -i "combobox\|select\|combo"
```

Use whichever combobox exists (`Combobox` from `@/components/ui/combobox` or Radix `Select` if combobox is absent).

- [ ] **Step 3: Create `workstation-agents-tab.tsx`**

```tsx
// ui/web/src/pages/workstations/workstation-agents-tab.tsx
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Star, Trash2, Loader2, UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkstationLinks } from "./hooks/use-workstation-links";
import { toast } from "@/stores/use-toast-store";
import i18n from "@/i18n";

interface WorkstationAgentsTabProps {
  workstationId: string;
}

export function WorkstationAgentsTab({ workstationId }: WorkstationAgentsTabProps) {
  const { t } = useTranslation("workstations");
  const { links, agents, loading, linkAgent, unlinkAgent, setDefault } = useWorkstationLinks({
    mode: "forWorkstation",
    workstationId,
  });

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [mutating, setMutating] = useState<string | null>(null); // agentId being mutated

  // Agents not yet linked
  const linkedAgentIds = useMemo(() => new Set(links.map((l) => l.agentId)), [links]);
  const availableAgents = useMemo(
    () => agents.filter((a) => !linkedAgentIds.has(a.id)),
    [agents, linkedAgentIds],
  );

  // Resolve agent display name from agents list
  const agentName = (agentId: string) => {
    const a = agents.find((ag) => ag.id === agentId);
    return a?.display_name || a?.agent_key || agentId;
  };

  const handleLink = async () => {
    if (!selectedAgentId) return;
    setMutating(selectedAgentId);
    try {
      const isFirst = links.length === 0;
      await linkAgent(selectedAgentId, workstationId, isFirst);
      setSelectedAgentId("");
    } catch {
      toast.error(i18n.t("workstations:agents.linkError"));
    } finally {
      setMutating(null);
    }
  };

  const handleUnlink = async (agentId: string, isDefault: boolean) => {
    const msg = isDefault
      ? t("agents.confirmUnlinkDefault")
      : t("agents.confirmUnlink");
    if (!window.confirm(msg)) return;
    setMutating(agentId);
    try {
      await unlinkAgent(agentId, workstationId);
    } catch {
      toast.error(i18n.t("workstations:agents.unlinkError"));
    } finally {
      setMutating(null);
    }
  };

  const handleSetDefault = async (agentId: string) => {
    setMutating(agentId);
    try {
      await setDefault(agentId, workstationId);
    } catch {
      toast.error(i18n.t("workstations:agents.setDefaultError"));
    } finally {
      setMutating(null);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        {t("agents.sectionTitle")}
      </h4>

      {/* Link new agent */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedAgentId}
          onValueChange={setSelectedAgentId}
          disabled={availableAgents.length === 0 || mutating !== null}
        >
          <SelectTrigger className="flex-1 text-base md:text-sm">
            <SelectValue
              placeholder={
                availableAgents.length === 0
                  ? t("agents.noAgentsAvailable")
                  : t("agents.linkPlaceholder")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableAgents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.display_name || a.agent_key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleLink}
          disabled={!selectedAgentId || mutating !== null}
          className="gap-1 shrink-0"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t("agents.link")}
        </Button>
      </div>

      {/* Linked agents list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-6 space-y-1">
          <p className="text-sm text-muted-foreground">{t("agents.empty")}</p>
          <p className="text-xs text-muted-foreground">{t("agents.emptyHint")}</p>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {links.map((link) => {
            const isMutating = mutating === link.agentId;
            return (
              <div
                key={link.agentId}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {link.isDefault && (
                    <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" fill="currentColor" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {agentName(link.agentId)}
                  </span>
                  {link.isDefault && (
                    <Badge variant="outline" className="text-2xs shrink-0">
                      {t("agents.defaultBadge")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!link.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSetDefault(link.agentId)}
                      disabled={isMutating}
                    >
                      {isMutating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        t("agents.setDefault")
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnlink(link.agentId, link.isDefault)}
                    disabled={isMutating}
                  >
                    {isMutating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/tungpt/Development/thanhtunguet/goclaw/ui/web && pnpm tsc --noEmit 2>&1 | grep -E "workstation-agents-tab|error TS" | head -20
```

Fix any type errors (likely `AgentData` field names — check `@/types/agent`).

- [ ] **Step 5: Commit**

```bash
git add ui/web/src/pages/workstations/workstation-agents-tab.tsx
git commit -m "feat(workstations): add WorkstationAgentsTab component"
```

---

## Task 5: Wire `WorkstationAgentsTab` into `workstations-page.tsx`

**Goal:** Add "Agents" tab trigger and content panel to the expanded row in the workstation list.

**Files:**
- Modify: `ui/web/src/pages/workstations/workstations-page.tsx`

**Acceptance Criteria:**
- [ ] Expanded row shows two tabs: "Activity" and "Agents"
- [ ] "Agents" tab renders `WorkstationAgentsTab`
- [ ] Tab label uses `t("agents.tabTitle")` from workstations namespace

**Verify:** `cd ui/web && pnpm tsc --noEmit 2>&1 | grep workstations-page` → no output

**Steps:**

- [ ] **Step 1: Add import for `WorkstationAgentsTab`**

In `workstations-page.tsx`, after the existing `WorkstationActivityTab` import (line 16), add:

```tsx
import { WorkstationAgentsTab } from "./workstation-agents-tab";
```

- [ ] **Step 2: Update the expanded row tabs**

Find the `<Tabs defaultValue="activity">` block (around line 121) and replace it:

```tsx
<Tabs defaultValue="activity">
  <TabsList className="mb-3">
    <TabsTrigger value="activity">{t("activity.title")}</TabsTrigger>
    <TabsTrigger value="agents">{t("agents.tabTitle")}</TabsTrigger>
  </TabsList>
  <TabsContent value="activity">
    <WorkstationActivityTab workstationId={ws.id} />
  </TabsContent>
  <TabsContent value="agents">
    <WorkstationAgentsTab workstationId={ws.id} />
  </TabsContent>
</Tabs>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/tungpt/Development/thanhtunguet/goclaw/ui/web && pnpm tsc --noEmit 2>&1 | grep -E "workstations-page|error TS" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add ui/web/src/pages/workstations/workstations-page.tsx
git commit -m "feat(workstations): add Agents tab to expanded workstation row"
```

---

## Task 6: `WorkstationLinksSection` component

**Goal:** Create the workstation-links section for the agent permissions tab — shows workstations the agent can access with grant/revoke/set-default actions.

**Files:**
- Create: `ui/web/src/pages/agents/agent-detail/workstation-links-section.tsx`

**Acceptance Criteria:**
- [ ] Renders list of workstations linked to the agent
- [ ] Shows "default" badge on the default workstation
- [ ] Select/combobox to grant access to a new workstation (filters already-linked)
- [ ] "Set as default" button for non-default links
- [ ] "Revoke" button removes the link
- [ ] Empty state with hint text
- [ ] Loading spinner while fetching
- [ ] All text uses `useTranslation("agents")` keys from Task 2

**Verify:** `cd ui/web && pnpm tsc --noEmit 2>&1 | grep workstation-links-section` → no output

**Steps:**

- [ ] **Step 1: Create `workstation-links-section.tsx`**

```tsx
// ui/web/src/pages/agents/agent-detail/workstation-links-section.tsx
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ServerCog, Star, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkstationLinks } from "@/pages/workstations/hooks/use-workstation-links";
import { toast } from "@/stores/use-toast-store";
import i18n from "@/i18n";

interface WorkstationLinksSectionProps {
  agentId: string;
}

export function WorkstationLinksSection({ agentId }: WorkstationLinksSectionProps) {
  const { t } = useTranslation("agents");
  const { links, workstations, loading, linkAgent, unlinkAgent, setDefault } =
    useWorkstationLinks({ mode: "forAgent", agentId });

  const [selectedWsId, setSelectedWsId] = useState("");
  const [mutating, setMutating] = useState<string | null>(null); // workstationId being mutated

  // Workstations not yet linked to this agent
  const linkedWsIds = useMemo(() => new Set(links.map((l) => l.workstationId)), [links]);
  const availableWorkstations = useMemo(
    () => workstations.filter((ws) => !linkedWsIds.has(ws.id)),
    [workstations, linkedWsIds],
  );

  const wsName = (workstationId: string) => {
    const ws = workstations.find((w) => w.id === workstationId);
    return ws ? `${ws.name} (${ws.backendType})` : workstationId;
  };

  const handleGrant = async () => {
    if (!selectedWsId) return;
    setMutating(selectedWsId);
    try {
      const isFirst = links.length === 0;
      await linkAgent(agentId, selectedWsId, isFirst);
      setSelectedWsId("");
    } catch {
      toast.error(i18n.t("agents:workstations.grantError"));
    } finally {
      setMutating(null);
    }
  };

  const handleRevoke = async (workstationId: string) => {
    setMutating(workstationId);
    try {
      await unlinkAgent(agentId, workstationId);
    } catch {
      toast.error(i18n.t("agents:workstations.revokeError"));
    } finally {
      setMutating(null);
    }
  };

  const handleSetDefault = async (workstationId: string) => {
    setMutating(workstationId);
    try {
      await setDefault(agentId, workstationId);
    } catch {
      toast.error(i18n.t("agents:workstations.setDefaultError"));
    } finally {
      setMutating(null);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border p-3 sm:p-4 mt-4">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2">
          <ServerCog className="h-4 w-4 text-blue-500" />
          {t("workstations.sectionTitle")}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("workstations.sectionDescription")}
        </p>
      </div>

      {/* Grant access row */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedWsId}
          onValueChange={setSelectedWsId}
          disabled={availableWorkstations.length === 0 || mutating !== null}
        >
          <SelectTrigger className="flex-1 text-base md:text-sm">
            <SelectValue
              placeholder={
                availableWorkstations.length === 0
                  ? t("workstations.noWorkstationsAvailable")
                  : t("workstations.grantPlaceholder")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableWorkstations.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.name} <span className="text-muted-foreground ml-1">({ws.backendType})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleGrant}
          disabled={!selectedWsId || mutating !== null}
          className="shrink-0"
        >
          {t("workstations.grantAccess")}
        </Button>
      </div>

      {/* Linked workstations list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-6 space-y-1">
          <p className="text-sm text-muted-foreground">{t("workstations.empty")}</p>
          <p className="text-xs text-muted-foreground">{t("workstations.emptyHint")}</p>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {links.map((link) => {
            const isMutating = mutating === link.workstationId;
            return (
              <div
                key={link.workstationId}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {link.isDefault && (
                    <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" fill="currentColor" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {wsName(link.workstationId)}
                  </span>
                  {link.isDefault && (
                    <Badge variant="outline" className="text-2xs shrink-0">
                      {t("workstations.defaultBadge")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!link.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSetDefault(link.workstationId)}
                      disabled={isMutating}
                    >
                      {isMutating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        t("workstations.setDefault")
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(link.workstationId)}
                    disabled={isMutating}
                  >
                    {isMutating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/tungpt/Development/thanhtunguet/goclaw/ui/web && pnpm tsc --noEmit 2>&1 | grep -E "workstation-links-section|error TS" | head -20
```

Fix any type errors (check `@/types/agent` for `AgentData` shape, check `@/stores/use-toast-store` for `toast.error` signature).

- [ ] **Step 3: Commit**

```bash
git add ui/web/src/pages/agents/agent-detail/workstation-links-section.tsx
git commit -m "feat(agents): add WorkstationLinksSection component"
```

---

## Task 7: Wire `WorkstationLinksSection` into `AgentPermissionsTab`

**Goal:** Append `WorkstationLinksSection` at the bottom of the agent permissions tab.

**Files:**
- Modify: `ui/web/src/pages/agents/agent-detail/agent-permissions-tab.tsx`

**Acceptance Criteria:**
- [ ] `WorkstationLinksSection` renders below the existing permissions section
- [ ] Uses the same `agentId` prop already passed to `AgentPermissionsTab`
- [ ] No layout regression on existing content

**Verify:** `cd ui/web && pnpm tsc --noEmit 2>&1 | grep agent-permissions-tab` → no output

**Steps:**

- [ ] **Step 1: Add import**

In `agent-permissions-tab.tsx`, add after existing imports:

```tsx
import { WorkstationLinksSection } from "./workstation-links-section";
```

- [ ] **Step 2: Append component**

The current `AgentPermissionsTab` renders a single `<section>` element. Wrap both sections in a fragment or a `<div className="space-y-4">`. Find the closing `</section>` of the existing permissions card (around line 396) and change the return structure:

```tsx
return (
  <>
    <section className="space-y-4 rounded-lg border p-3 sm:p-4">
      {/* ... existing permissions content unchanged ... */}
    </section>
    <WorkstationLinksSection agentId={agentId} />
  </>
);
```

The `agentId` is already available as a prop of `AgentPermissionsTab`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/tungpt/Development/thanhtunguet/goclaw/ui/web && pnpm tsc --noEmit 2>&1 | grep -E "agent-permissions-tab|error TS" | head -20
```

- [ ] **Step 4: Build check**

```bash
cd /Users/tungpt/Development/thanhtunguet/goclaw/ui/web && pnpm build 2>&1 | tail -20
```

Expected: build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add ui/web/src/pages/agents/agent-detail/agent-permissions-tab.tsx
git commit -m "feat(agents): append WorkstationLinksSection to AgentPermissionsTab"
```

---

## Self-Review

**Spec coverage:**
- ✅ `use-workstation-links.ts` hook — Task 3
- ✅ `WorkstationAgentsTab` — Task 4
- ✅ Wire workstation tab — Task 5
- ✅ `WorkstationLinksSection` — Task 6
- ✅ Wire agent permissions — Task 7
- ✅ i18n workstations namespace — Task 1
- ✅ i18n agents namespace — Task 2

**Placeholder scan:** No TBD/TODO. All code is complete. Task 3 Step 1 explains a conditional investigation but gives clear guidance either way.

**Type consistency:**
- `AgentWorkstationLink.agentId` / `workstationId` / `isDefault` — used consistently across Tasks 3, 4, 6
- `WorkstationInfo` type defined in hook, consumed in Task 6
- `useWorkstationLinks({ mode: "forWorkstation", workstationId })` — same API in Tasks 4 and 5
- `useWorkstationLinks({ mode: "forAgent", agentId })` — same API in Tasks 6 and 7
- `linkAgent(agentId, workstationId, isDefault)` — consistent signature across Tasks 4 and 6
- `unlinkAgent(agentId, workstationId)` — consistent across Tasks 4 and 6
- `setDefault(agentId, workstationId)` — consistent across Tasks 4 and 6
