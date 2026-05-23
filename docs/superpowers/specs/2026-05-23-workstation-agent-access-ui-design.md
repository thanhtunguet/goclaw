# Workstation Agent Access UI — Design Spec

**Date:** 2026-05-23  
**Status:** Approved  
**Scope:** Web UI only (`ui/web/`)

---

## Problem

The backend fully supports linking agents to workstations (`workstations.link_agent`, `workstations.unlink_agent`, `AgentWorkstationLinkStore`), but the web UI has no way to manage these links. Admins cannot grant or revoke workstation access for agents through the UI.

## What Already Exists (Backend)

All backend infrastructure is ready — no backend changes needed:

| Layer | Status |
|-------|--------|
| `AgentWorkstationLinkStore` (Link/Unlink/SetDefault/ListForAgent/ListForWorkstation) | ✅ Implemented |
| WS RPC `workstations.link_agent` / `workstations.unlink_agent` | ✅ Registered |
| Protocol constants `WORKSTATIONS_LINK_AGENT` / `WORKSTATIONS_UNLINK_AGENT` | ✅ In `protocol.ts` |
| `WorkstationExecTool.resolveWorkstation` — auto-uses default link | ✅ Working |

## Design Decision

**Approach chosen:** Separate hook + 2 components

- New hook `use-workstation-links.ts` — shared between both UIs
- New component `WorkstationAgentsTab` — tab inside the expanded workstation row
- New section `WorkstationLinksSection` — appended to `AgentPermissionsTab`

Rejected alternative: Extending `use-workstations.ts` would violate single-responsibility (workstation page needs `ListForWorkstation`, agent page needs `ListForAgent`).

---

## Architecture

### New Files

```
ui/web/src/pages/workstations/hooks/use-workstation-links.ts   — shared hook
ui/web/src/pages/workstations/workstation-agents-tab.tsx       — workstation → agents view
ui/web/src/pages/agents/agent-detail/workstation-links-section.tsx — agent → workstations view
```

### Modified Files

```
ui/web/src/pages/workstations/workstations-page.tsx            — add "Agents" tab trigger
ui/web/src/pages/agents/agent-detail/agent-permissions-tab.tsx — append WorkstationLinksSection
```

### i18n Files

```
ui/web/src/i18n/locales/en/workstations.json
ui/web/src/i18n/locales/vi/workstations.json
ui/web/src/i18n/locales/zh/workstations.json
ui/web/src/i18n/locales/en/agents.json        (for section title in permissions tab)
ui/web/src/i18n/locales/vi/agents.json
ui/web/src/i18n/locales/zh/agents.json
```

---

## Hook: `use-workstation-links.ts`

```ts
// Two fetch modes:
// - { mode: "forWorkstation", workstationId } → calls ListForWorkstation
// - { mode: "forAgent", agentId }             → calls ListForAgent

interface AgentWorkstationLink {
  agentId: string;
  workstationId: string;
  tenantId: string;
  isDefault: boolean;
  createdAt: string;
}

// Returns:
{
  links: AgentWorkstationLink[];
  loading: boolean;
  refresh: () => void;
  linkAgent: (agentId: string, workstationId: string, isDefault: boolean) => Promise<void>;
  unlinkAgent: (agentId: string, workstationId: string) => Promise<void>;
  setDefault: (agentId: string, workstationId: string) => Promise<void>;  // calls link_agent with isDefault=true
}
```

The hook calls these WS methods:
- `workstations.list` — to resolve workstation names in the agent view
- `workstations.link_agent` — for link and setDefault
- `workstations.unlink_agent` — for unlink
- `agents.list` (HTTP `/v1/agents`) — to resolve agent names in the workstation view

---

## Component 1: `WorkstationAgentsTab`

**Location in UI:** Second tab in the expanded row panel of each workstation (alongside "Activity").

**Layout:**
```
┌─ Agents linked to this workstation ──────────────────────────┐
│  [+ Link agent ▾ dropdown combobox]                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ★ coder-agent          [default]  [Set default] [✕] │    │
│  │   reviewer-agent                  [Set default] [✕] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  (empty state when no links)                                  │
└───────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Fetches linked agents via `ListForWorkstation` on mount
- Loads all agents (HTTP `/v1/agents`) for the combobox options — filters out already-linked agents
- "Link agent" combobox: select agent → call `link_agent` with `isDefault: false`; first link auto-marks default
- "Set default" button: calls `link_agent` with `isDefault: true` (clears prior default server-side)
- [✕] button: calls `unlink_agent`, shows confirm if the link being removed is the default
- Loading skeleton while fetching

---

## Component 2: `WorkstationLinksSection`

**Location in UI:** Appended at the bottom of `AgentPermissionsTab`, below the existing permissions section, as a separate card with a `ServerCog` icon header.

**Layout:**
```
┌─ 🖥 Workstation Access ───────────────────────────────────────┐
│  Workstations this agent can execute commands on              │
│                                              [↺ refresh]     │
│                                                               │
│  [+ Grant access ▾ dropdown combobox]                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ★ my-server (ssh)  [default]  [Set default] [Revoke]│    │
│  │   build-box (docker)          [Set default] [Revoke]│    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Fetches via `ListForAgent` on mount, resolves workstation names via `workstations.list`
- "Grant access" combobox: select workstation → `link_agent`; first link auto-marks default
- "Set default": `link_agent` with `isDefault: true`
- "Revoke": `unlink_agent`
- Empty state: "No workstations linked. Link a workstation so this agent can run commands."

---

## Data Flow

```
WorkstationsPage (expanded row)
  └─ WorkstationAgentsTab
       └─ use-workstation-links({ mode: "forWorkstation", workstationId })
            ├─ WS: workstations.link_agent   (link/setDefault)
            ├─ WS: workstations.unlink_agent (unlink)
            └─ HTTP: /v1/agents              (agent picker)

AgentPermissionsTab
  └─ WorkstationLinksSection
       └─ use-workstation-links({ mode: "forAgent", agentId })
            ├─ WS: workstations.link_agent   (link/setDefault)
            ├─ WS: workstations.unlink_agent (unlink)
            └─ WS: workstations.list         (workstation picker)
```

---

## i18n Keys

### workstations namespace (en/vi/zh)

```json
"agents": {
  "title": "Linked Agents",
  "empty": "No agents linked to this workstation",
  "link": "Link agent",
  "linkTitle": "Select an agent to grant access",
  "setDefault": "Set as default",
  "unlink": "Unlink",
  "defaultBadge": "default",
  "confirmUnlinkDefault": "This is the default workstation for this agent. Unlinking it will clear the default binding. Continue?"
}
```

### agents namespace (en/vi/zh)

```json
"workstations": {
  "sectionTitle": "Workstation Access",
  "sectionDescription": "Workstations this agent can execute commands on",
  "empty": "No workstations linked",
  "emptyHint": "Link a workstation so this agent can run commands on remote machines.",
  "grantAccess": "Grant access",
  "setDefault": "Set as default",
  "revoke": "Revoke",
  "defaultBadge": "default"
}
```

---

## Error Handling

- All WS calls wrapped in try/catch; errors shown as toast messages (using existing `useWs` error pattern)
- If `workstations.list` returns empty (no workstations), the combobox shows "No workstations available"
- If `/v1/agents` returns empty, the combobox shows "No agents available"
- Loading states: spinner in place of list while fetching; button disabled during mutations

---

## Non-Goals

- No `SetEnabled` / permission allowlist UI (separate Phase 6 concern)
- No activity log display (separate Phase 7 concern already handled in `WorkstationActivityTab`)
- No backend changes (all infrastructure exists)
- No desktop (`ui/desktop/`) changes
