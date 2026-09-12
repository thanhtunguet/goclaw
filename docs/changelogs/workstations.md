# Workstation management enhancements

## Workstation administration

- Administrators can now edit a workstation's name and active state from the
  web dashboard.
- The create dialog is scrollable, making the full form usable on constrained
  viewports.
- Every workstation row now exposes an **Agents** tab. Administrators can link
  and unlink agents, see each linked agent's display name and key, and choose
  the default binding.
- The first workstation linked to an agent automatically becomes its default.
  Later links only replace the default when explicitly selected.
- A **Permissions** tab lets administrators add, enable/disable, and remove
  per-workstation command allowlist patterns.

## WebSocket RPC additions

The gateway registers these administrator-only workstation methods:

| Method                            | Purpose                                                         |
|-----------------------------------|-----------------------------------------------------------------|
| `workstations.linkAgent`          | Link an agent to a workstation; optionally make it the default. |
| `workstations.unlinkAgent`        | Remove an agent-to-workstation link.                            |
| `workstations.listAgents`         | List agents linked to a workstation, including default status.  |
| `workstations.listForAgent`       | List a specific agent's linked workstations and default status. |
| `workstations.permissions.list`   | Read the workstation command allowlist.                         |
| `workstations.permissions.add`    | Add an enabled command allowlist pattern.                       |
| `workstations.permissions.remove` | Delete an allowlist entry.                                      |
| `workstations.permissions.toggle` | Enable or disable an allowlist entry.                           |

Link handlers validate both endpoints through tenant-scoped stores; permission
listing and creation verify workstation ownership. Responses expose sanitized
workstation views rather than connection credentials.

## Agent tools and execution safeguards

- Added `workstation_list`, a read-only Standard-edition tool that lists only
  workstations linked to the calling agent. Its output includes binding and
  backend details, but only sanitized metadata.
- `workstation_exec` now requires an explicit agent-to-workstation link even
  when the caller supplies a workstation ID. If no ID is supplied, it resolves
  the agent's default binding (or its sole link).
- Command permissions are default-deny. A command must match an enabled
  workstation allowlist pattern before execution.
- Command and argument checks normalize Unicode lookalikes, reject NUL/CRLF
  input, and reject unsafe environment-variable overrides such as `PATH`,
  `LD_PRELOAD`, and `DYLD_INSERT_LIBRARIES`.
- Workstation resolution verifies tenant ownership on both explicit-ID and
  default-binding paths, preventing cross-tenant execution through stale or
  invalid links.

## Tool catalogue and localization

- The built-in tool catalogue now includes `workstation_list` alongside
  `workstation_exec` and `claude_remote`.
- Workstation labels and error states were added or expanded for English,
  Vietnamese, Chinese, and Russian.
