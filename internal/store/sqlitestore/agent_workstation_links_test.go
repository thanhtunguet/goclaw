//go:build sqlite || sqliteonly

package sqlitestore

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	"github.com/google/uuid"

	"github.com/nextlevelbuilder/goclaw/internal/store"
)

func newAgentWorkstationLinkTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := OpenDB(filepath.Join(t.TempDir(), "agent_workstation_links_test.db"))
	if err != nil {
		t.Fatalf("OpenDB: %v", err)
	}
	if err := EnsureSchema(db); err != nil {
		db.Close()
		t.Fatalf("EnsureSchema: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

func seedAgentWorkstationLinkData(t *testing.T, db *sql.DB) (tenantID, agentID, ws1ID, ws2ID uuid.UUID) {
	t.Helper()

	tenantID = uuid.Must(uuid.NewV7())
	agentID = uuid.Must(uuid.NewV7())
	ws1ID = uuid.Must(uuid.NewV7())
	ws2ID = uuid.Must(uuid.NewV7())

	_, err := db.Exec(
		`INSERT INTO tenants (id, name, slug, status) VALUES (?,?,?,'active')`,
		tenantID.String(), "tenant-"+tenantID.String()[:8], "t"+tenantID.String()[:8],
	)
	if err != nil {
		t.Fatalf("seed tenant: %v", err)
	}

	_, err = db.Exec(
		`INSERT INTO agents (id, tenant_id, agent_key, agent_type, status, provider, model, owner_id)
		 VALUES (?,?,?,'predefined','active','test','test-model','owner')`,
		agentID.String(), tenantID.String(), "agent-"+agentID.String()[:8],
	)
	if err != nil {
		t.Fatalf("seed agent: %v", err)
	}

	insertWorkstation := func(id uuid.UUID, key string) {
		t.Helper()
		_, e := db.Exec(
			`INSERT INTO workstations (id, workstation_key, tenant_id, name, backend_type, metadata, default_cwd, default_env, active, created_by)
			 VALUES (?,?,?,?,?,'{}','/tmp','{}',1,'test')`,
			id.String(), key, tenantID.String(), "ws-"+key, "ssh",
		)
		if e != nil {
			t.Fatalf("seed workstation %s: %v", key, e)
		}
	}

	insertWorkstation(ws1ID, "ws1-"+ws1ID.String()[:8])
	insertWorkstation(ws2ID, "ws2-"+ws2ID.String()[:8])

	return tenantID, agentID, ws1ID, ws2ID
}

func TestSQLiteAgentWorkstationLinkStore_Link_SwitchDefaultOnExistingRow(t *testing.T) {
	db := newAgentWorkstationLinkTestDB(t)
	tenantID, agentID, ws1ID, ws2ID := seedAgentWorkstationLinkData(t, db)
	ctx := store.WithTenantID(context.Background(), tenantID)
	s := NewSQLiteAgentWorkstationLinkStore(db)

	if err := s.Link(ctx, &store.AgentWorkstationLink{AgentID: agentID, WorkstationID: ws1ID, IsDefault: true}); err != nil {
		t.Fatalf("link ws1 as default: %v", err)
	}
	if err := s.Link(ctx, &store.AgentWorkstationLink{AgentID: agentID, WorkstationID: ws2ID, IsDefault: false}); err != nil {
		t.Fatalf("link ws2 as non-default: %v", err)
	}

	if err := s.Link(ctx, &store.AgentWorkstationLink{AgentID: agentID, WorkstationID: ws2ID, IsDefault: true}); err != nil {
		t.Fatalf("switch default to existing ws2 row should succeed: %v", err)
	}

	links, err := s.ListForAgent(ctx, agentID)
	if err != nil {
		t.Fatalf("ListForAgent: %v", err)
	}
	if len(links) != 2 {
		t.Fatalf("expected 2 links, got %d", len(links))
	}

	defaultCount := 0
	for _, l := range links {
		if l.IsDefault {
			defaultCount++
			if l.WorkstationID != ws2ID {
				t.Fatalf("expected ws2 to be default, got %s", l.WorkstationID)
			}
		}
	}
	if defaultCount != 1 {
		t.Fatalf("expected exactly 1 default link, got %d", defaultCount)
	}
}
