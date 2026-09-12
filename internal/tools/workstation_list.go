package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// WorkstationListTool returns the sanitized list of workstations linked to the
// calling agent. Read-only — never exposes credentials (only SanitizedView).
// Registered Standard-edition only.
type WorkstationListTool struct {
	wsStore   store.WorkstationStore
	linkStore store.AgentWorkstationLinkStore
}

// NewWorkstationListTool creates a WorkstationListTool.
func NewWorkstationListTool(wsStore store.WorkstationStore, linkStore store.AgentWorkstationLinkStore) *WorkstationListTool {
	return &WorkstationListTool{wsStore: wsStore, linkStore: linkStore}
}

func (t *WorkstationListTool) Name() string { return "workstation_list" }

func (t *WorkstationListTool) Description() string {
	return "List the remote workstations linked to the current agent, including their default binding, backend type, and sanitized connection metadata."
}

func (t *WorkstationListTool) Parameters() map[string]any {
	return map[string]any{
		"type":       "object",
		"properties": map[string]any{},
	}
}

// workstationListItem is the per-row JSON shape returned to the LLM.
type workstationListItem struct {
	ID              string         `json:"id"`
	WorkstationKey  string         `json:"workstation_key"`
	Name            string         `json:"name"`
	BackendType     string         `json:"backend_type"`
	DefaultCWD      string         `json:"default_cwd"`
	Active          bool           `json:"active"`
	IsDefault       bool           `json:"is_default"`
	MetadataSummary map[string]any `json:"metadata_summary,omitempty"`
}

// Execute enumerates agent→workstation links and returns sanitized details.
func (t *WorkstationListTool) Execute(ctx context.Context, _ map[string]any) *Result {
	agentID := store.AgentIDFromContext(ctx)

	links, err := t.linkStore.ListForAgent(ctx, agentID)
	if err != nil {
		return ErrorResult(fmt.Sprintf("failed to list workstation links: %v", err))
	}
	if len(links) == 0 {
		return NewResult("no workstations are linked to this agent; use the web UI to link one before running workstation_exec.")
	}

	items := make([]workstationListItem, 0, len(links))
	for _, link := range links {
		ws, err := t.wsStore.GetByID(ctx, link.WorkstationID)
		if err != nil {
			// Skip stale links (workstation deleted out from under the binding).
			continue
		}
		sv := ws.SanitizedView()
		items = append(items, workstationListItem{
			ID:              sv.ID.String(),
			WorkstationKey:  sv.WorkstationKey,
			Name:            sv.Name,
			BackendType:     string(sv.BackendType),
			DefaultCWD:      sv.DefaultCWD,
			Active:          sv.Active,
			IsDefault:       link.IsDefault,
			MetadataSummary: sv.MetadataSummary,
		})
	}

	if len(items) == 0 {
		return NewResult("agent has workstation links but none resolve to an existing active workstation.")
	}

	data, err := json.Marshal(items)
	if err != nil {
		return ErrorResult(fmt.Sprintf("failed to serialize workstation list: %v", err))
	}
	return NewResult(string(data))
}
