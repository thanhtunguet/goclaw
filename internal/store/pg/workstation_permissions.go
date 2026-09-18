package pg

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// PGWorkstationPermissionStore implements store.WorkstationPermissionStore backed by PostgreSQL.
type PGWorkstationPermissionStore struct {
	db *sql.DB
}

// NewPGWorkstationPermissionStore creates a PGWorkstationPermissionStore.
func NewPGWorkstationPermissionStore(db *sql.DB) *PGWorkstationPermissionStore {
	return &PGWorkstationPermissionStore{db: db}
}

const wpSelectCols = `id, workstation_id, tenant_id, pattern, enabled, created_by, created_at`

func (s *PGWorkstationPermissionStore) ListForWorkstation(ctx context.Context, workstationID uuid.UUID) ([]store.WorkstationPermission, error) {
	tid := store.TenantIDFromContext(ctx)
	if tid == uuid.Nil {
		return nil, nil
	}
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+wpSelectCols+` FROM workstation_permissions
		 WHERE workstation_id = $1 AND tenant_id = $2
		 ORDER BY created_at`,
		workstationID, tid)
	if err != nil {
		return nil, fmt.Errorf("workstation_permissions list: %w", err)
	}
	return scanPermRows(rows)
}

func (s *PGWorkstationPermissionStore) Add(ctx context.Context, perm *store.WorkstationPermission) error {
	if perm.ID == uuid.Nil {
		perm.ID = store.GenNewID()
	}
	tid := store.TenantIDFromContext(ctx)
	if tid == uuid.Nil {
		return fmt.Errorf("tenant_id required")
	}
	perm.TenantID = tid
	if perm.CreatedAt.IsZero() {
		perm.CreatedAt = time.Now()
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO workstation_permissions
		 (id, workstation_id, tenant_id, pattern, enabled, created_by, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)
		 ON CONFLICT (workstation_id, pattern) DO NOTHING`,
		perm.ID, perm.WorkstationID, tid, perm.Pattern,
		perm.Enabled, perm.CreatedBy, perm.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("workstation_permissions add: %w", err)
	}
	return nil
}

func (s *PGWorkstationPermissionStore) Remove(ctx context.Context, id uuid.UUID) error {
	tid := store.TenantIDFromContext(ctx)
	if tid == uuid.Nil {
		return fmt.Errorf("tenant_id required")
	}
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM workstation_permissions WHERE id = $1 AND tenant_id = $2`, id, tid)
	if err != nil {
		return fmt.Errorf("workstation_permissions remove: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *PGWorkstationPermissionStore) SetEnabled(ctx context.Context, id uuid.UUID, enabled bool) error {
	tid := store.TenantIDFromContext(ctx)
	if tid == uuid.Nil {
		return fmt.Errorf("tenant_id required")
	}
	_, err := s.db.ExecContext(ctx,
		`UPDATE workstation_permissions SET enabled = $1 WHERE id = $2 AND tenant_id = $3`,
		enabled, id, tid)
	return err
}

// SeedDefaults inserts default safe binary names for a new workstation.
// Must be called inside the same transaction as workstation creation (H5 fix).
// Uses ON CONFLICT DO NOTHING — safe to call multiple times.
// AddBatch inserts multiple allowlist entries in a single transaction.
func (s *PGWorkstationPermissionStore) AddBatch(ctx context.Context, perms []store.WorkstationPermission) (int, error) {
	if len(perms) == 0 {
		return 0, nil
	}
	tid := store.TenantIDFromContext(ctx)
	if tid == uuid.Nil {
		return 0, fmt.Errorf("tenant_id required")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("workstation_permissions add batch begin tx: %w", err)
	}
	defer tx.Rollback()
	count := 0
	for i := range perms {
		p := &perms[i]
		if p.ID == uuid.Nil {
			p.ID = store.GenNewID()
		}
		p.TenantID = tid
		if p.CreatedAt.IsZero() {
			p.CreatedAt = time.Now()
		}
		res, err := tx.ExecContext(ctx,
			`INSERT INTO workstation_permissions
			 (id, workstation_id, tenant_id, pattern, enabled, created_by, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)
			 ON CONFLICT (workstation_id, pattern) DO NOTHING`,
			p.ID, p.WorkstationID, tid, p.Pattern, p.Enabled, p.CreatedBy, p.CreatedAt,
		)
		if err != nil {
			return 0, fmt.Errorf("workstation_permissions add batch item %d: %w", i, err)
		}
		n, _ := res.RowsAffected()
		count += int(n)
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("workstation_permissions add batch commit: %w", err)
	}
	return count, nil
}

// RemoveBatch deletes multiple allowlist entries by ID in a single transaction.
func (s *PGWorkstationPermissionStore) RemoveBatch(ctx context.Context, ids []uuid.UUID) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	tid := store.TenantIDFromContext(ctx)
	if tid == uuid.Nil {
		return 0, fmt.Errorf("tenant_id required")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("workstation_permissions remove batch begin tx: %w", err)
	}
	defer tx.Rollback()
	count := 0
	for _, id := range ids {
		res, err := tx.ExecContext(ctx,
			`DELETE FROM workstation_permissions WHERE id = $1 AND tenant_id = $2`, id, tid)
		if err != nil {
			return 0, fmt.Errorf("workstation_permissions remove batch item: %w", err)
		}
		n, _ := res.RowsAffected()
		count += int(n)
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("workstation_permissions remove batch commit: %w", err)
	}
	return count, nil
}

func (s *PGWorkstationPermissionStore) SeedDefaults(ctx context.Context, workstationID, tenantID uuid.UUID) error {
	for _, pattern := range store.DefaultAllowedBinaries {
		_, err := s.db.ExecContext(ctx,
			`INSERT INTO workstation_permissions
			 (id, workstation_id, tenant_id, pattern, enabled, created_by, created_at)
			 VALUES ($1,$2,$3,$4,TRUE,'system',NOW())
			 ON CONFLICT (workstation_id, pattern) DO NOTHING`,
			store.GenNewID(), workstationID, tenantID, pattern,
		)
		if err != nil {
			return fmt.Errorf("seed default permission %q: %w", pattern, err)
		}
	}
	return nil
}

func scanPermRows(rows *sql.Rows) ([]store.WorkstationPermission, error) {
	defer rows.Close()
	var result []store.WorkstationPermission
	for rows.Next() {
		p, err := scanPermRow(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func scanPermRow(s interface {
	Scan(...any) error
}) (store.WorkstationPermission, error) {
	var p store.WorkstationPermission
	err := s.Scan(&p.ID, &p.WorkstationID, &p.TenantID, &p.Pattern, &p.Enabled, &p.CreatedBy, &p.CreatedAt)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return p, fmt.Errorf("scan workstation_permission: %w", err)
	}
	return p, nil
}
