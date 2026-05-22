package tools

import (
	"context"
	"testing"

	"github.com/nextlevelbuilder/goclaw/internal/config"
)

type policyMCPTestTool struct {
	name string
}

func (t policyMCPTestTool) Name() string        { return t.name }
func (t policyMCPTestTool) Description() string { return "test tool" }
func (t policyMCPTestTool) Parameters() map[string]any {
	return map[string]any{"type": "object", "properties": map[string]any{}}
}
func (t policyMCPTestTool) Execute(context.Context, map[string]any) *Result {
	return NewResult("ok")
}

func TestRegistry_RegisterToolGroup(t *testing.T) {
	reg := NewRegistry()

	// Register a new MCP group
	reg.RegisterToolGroup("mcp:postgres", []string{"mcp_pg__query", "mcp_pg__list_tables"})

	members, ok := reg.GetToolGroup("mcp:postgres")
	if !ok {
		t.Fatal("expected mcp:postgres group to exist")
	}
	if len(members) != 2 {
		t.Errorf("expected 2 members, got %d", len(members))
	}

	// Unregister
	reg.UnregisterToolGroup("mcp:postgres")
	if _, ok := reg.GetToolGroup("mcp:postgres"); ok {
		t.Error("expected mcp:postgres group to be removed")
	}
}

func TestRegistry_RegisterToolGroup_UsedInExpand(t *testing.T) {
	reg := NewRegistry()
	reg.RegisterToolGroup("mcp:test", []string{"mcp_test__tool_a", "mcp_test__tool_b"})
	defer reg.UnregisterToolGroup("mcp:test")

	available := []string{"mcp_test__tool_a", "mcp_test__tool_b", "read_file", "exec"}
	expanded := expandSpec(reg, available, []string{"group:mcp:test"})

	if len(expanded) != 2 {
		t.Errorf("expected 2 tools from group:mcp:test, got %d: %v", len(expanded), expanded)
	}

	// Verify it works with subtractSpec too
	remaining := subtractSpec(reg, available, []string{"group:mcp:test"})
	if len(remaining) != 2 {
		t.Errorf("expected 2 remaining after subtract, got %d: %v", len(remaining), remaining)
	}
}

func TestPolicyEngine_FilterToolsUsesActiveRegistryForMCPAlsoAllow(t *testing.T) {
	reg := NewRegistry()
	reg.Register(policyMCPTestTool{name: "session_status"})
	reg.Register(policyMCPTestTool{name: "mcp_pg__query"})
	reg.RegisterToolGroup("mcp", []string{"mcp_pg__query"})

	pe := NewPolicyEngine(&config.ToolsConfig{Profile: "minimal"})
	defs := pe.FilterTools(reg, "agent-1", "openai", &config.ToolPolicySpec{
		AlsoAllow: []string{"group:mcp"},
	}, nil, false, false)

	got := map[string]bool{}
	for _, def := range defs {
		if def.Function != nil {
			got[def.Function.Name] = true
		}
	}
	if !got["session_status"] {
		t.Fatalf("minimal profile tool missing from filtered defs: %#v", got)
	}
	if !got["mcp_pg__query"] {
		t.Fatalf("MCP tool from active registry group:mcp was not also-allowed: %#v", got)
	}
}

func TestPolicyEngine_FilterToolsUsesActiveRegistryForProfileGroups(t *testing.T) {
	reg := NewRegistry()
	reg.Register(policyMCPTestTool{name: "read_file"})
	reg.Register(policyMCPTestTool{name: "exec"})

	pe := NewPolicyEngine(&config.ToolsConfig{Profile: "coding"})
	defs := pe.FilterTools(reg, "agent-1", "openai", nil, nil, false, false)

	got := map[string]bool{}
	for _, def := range defs {
		if def.Function != nil {
			got[def.Function.Name] = true
		}
	}
	if !got["read_file"] || !got["exec"] {
		t.Fatalf("profile group expansion should use active registry, got %#v", got)
	}
}
