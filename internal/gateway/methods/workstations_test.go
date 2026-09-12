package methods

import (
	"context"
	"database/sql"
	"encoding/json"
	"reflect"
	"testing"
	"time"
	"unsafe"

	"github.com/google/uuid"
	"github.com/nextlevelbuilder/goclaw/internal/gateway"
	"github.com/nextlevelbuilder/goclaw/internal/store"
	"github.com/nextlevelbuilder/goclaw/pkg/protocol"
)

type stubWorkstationStore struct {
	byID map[uuid.UUID]store.Workstation
}

func (s *stubWorkstationStore) Create(context.Context, *store.Workstation) error { return nil }
func (s *stubWorkstationStore) GetByID(_ context.Context, id uuid.UUID) (*store.Workstation, error) {
	if ws, ok := s.byID[id]; ok {
		return &ws, nil
	}
	return nil, sql.ErrNoRows
}
func (s *stubWorkstationStore) GetByKey(context.Context, string) (*store.Workstation, error) {
	return nil, nil
}
func (s *stubWorkstationStore) List(context.Context) ([]store.Workstation, error)       { return nil, nil }
func (s *stubWorkstationStore) Update(context.Context, uuid.UUID, map[string]any) error { return nil }
func (s *stubWorkstationStore) SetActive(context.Context, uuid.UUID, bool) error        { return nil }
func (s *stubWorkstationStore) Delete(context.Context, uuid.UUID) error                 { return nil }

type stubLinkStore struct {
	links []store.AgentWorkstationLink
}

func (s *stubLinkStore) Link(context.Context, *store.AgentWorkstationLink) error { return nil }
func (s *stubLinkStore) Unlink(context.Context, uuid.UUID, uuid.UUID) error      { return nil }
func (s *stubLinkStore) SetDefault(context.Context, uuid.UUID, uuid.UUID) error  { return nil }
func (s *stubLinkStore) ListForAgent(context.Context, uuid.UUID) ([]store.AgentWorkstationLink, error) {
	return s.links, nil
}
func (s *stubLinkStore) ListForWorkstation(context.Context, uuid.UUID) ([]store.AgentWorkstationLink, error) {
	return nil, nil
}

func clientSendChannel(c *gateway.Client) chan []byte {
	v := reflect.ValueOf(c).Elem().FieldByName("send")
	return *(*chan []byte)(unsafe.Pointer(v.UnsafeAddr()))
}

func TestWorkstationsMethods_ListForAgent_ReturnsAllAssignedWorkstations(t *testing.T) {
	agentID := uuid.New()
	wsA := uuid.New()
	wsB := uuid.New()
	ctx := store.WithTenantID(context.Background(), uuid.New())
	wsStore := &stubWorkstationStore{byID: map[uuid.UUID]store.Workstation{
		wsA: {ID: wsA, WorkstationKey: "alpha", Name: "Alpha", BackendType: store.BackendSSH, Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		wsB: {ID: wsB, WorkstationKey: "beta", Name: "Beta", BackendType: store.BackendDocker, Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}}
	linkStore := &stubLinkStore{links: []store.AgentWorkstationLink{
		{AgentID: agentID, WorkstationID: wsA, IsDefault: true, CreatedAt: time.Now()},
		{AgentID: agentID, WorkstationID: wsB, IsDefault: false, CreatedAt: time.Now()},
	}}
	m := &WorkstationsMethods{wsStore: wsStore, linkStore: linkStore}
	client := gateway.NewClient(nil, nil, "127.0.0.1")
	sendCh := clientSendChannel(client)
	reqJSON, err := json.Marshal(map[string]any{"agentId": agentID.String()})
	if err != nil {
		t.Fatalf("marshal req: %v", err)
	}
	req := &protocol.RequestFrame{ID: "list-for-agent", Method: protocol.MethodWorkstationsListForAgent, Params: reqJSON}

	m.handleListForAgent(ctx, client, req)
	select {
	case msg := <-sendCh:
		var resp protocol.ResponseFrame
		if err := json.Unmarshal(msg, &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if !resp.OK {
			t.Fatalf("expected success response, got error: %+v", resp.Error)
		}
		payload, ok := resp.Payload.(map[string]any)
		if !ok {
			t.Fatalf("unexpected payload type %T", resp.Payload)
		}
		workstations, ok := payload["workstations"].([]any)
		if !ok {
			t.Fatalf("expected workstations array, got %T", payload["workstations"])
		}
		if len(workstations) != 2 {
			t.Fatalf("expected 2 linked workstations, got %d", len(workstations))
		}
	default:
		t.Fatal("expected a response frame to be sent")
	}
}
