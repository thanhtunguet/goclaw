import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useWorkstationPermissions } from "./hooks/use-workstation-permissions";

interface WorkstationPermissionsTabProps {
  workstationId: string;
}

export function WorkstationPermissionsTab({ workstationId }: WorkstationPermissionsTabProps) {
  const { t } = useTranslation("workstations");
  const { permissions, loading, error, refresh, add, addBulk, remove, removeBulk, setEnabled } = useWorkstationPermissions(workstationId);
  const [pattern, setPattern] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id?: string }>({ open: false });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  async function handleAdd() {
    const rawItems = pattern
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const items = Array.from(new Set(rawItems));
    if (items.length === 0 || items.some((item) => item === "*")) {
      setActionError(t("permissions.errors.invalidPattern"));
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      if (items.length === 1) {
        await add(items[0]!);
      } else {
        await addBulk(items);
      }
      setPattern("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("permissions.errors.addFailed"));
    } finally {
      setSaving(false);
    }
  }

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(permissions.map((p) => p.id)) : new Set());
  }

  function openBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    setBulkDeleteConfirm(true);
  }

  async function handleBulkRemove() {
    if (selectedIds.size === 0) return;
    setSaving(true);
    setActionError(null);
    try {
      await removeBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("permissions.errors.removeFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    setSaving(true);
    setActionError(null);
    try {
      await setEnabled(id, enabled);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("permissions.errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(id: string) {
    setDeleteConfirm({ open: true, id });
  }

  async function handleRemove(id: string) {
    setSaving(true);
    setActionError(null);
    try {
      await remove(id);
      setDeleteConfirm({ open: false });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("permissions.errors.removeFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading && permissions.length === 0) {
    return <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{t("permissions.title")}</p>
          <p className="text-sm text-muted-foreground">{t("permissions.description")}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => void refresh()} disabled={loading || saving}>
          <RefreshCw className={"h-3.5 w-3.5" + (loading ? " animate-spin" : "")} />
          {t("common:refresh", "Refresh")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void handleAdd(); }}
          placeholder={t("permissions.patternPlaceholderMulti")}
          className="text-base md:text-sm"
          aria-label={t("permissions.patternLabel")}
          disabled={saving}
        />
        <Button className="gap-1" onClick={() => void handleAdd()} disabled={saving || !pattern.trim()}>
          <Plus className="h-4 w-4" />
          {t("permissions.add")}
        </Button>
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            className="gap-1"
            onClick={() => openBulkDeleteConfirm()}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
            {t("permissions.bulkRemove", { count: selectedIds.size })}
          </Button>
        )}
      </div>

      {(error || actionError) && <p className="text-sm text-destructive">{actionError ?? error}</p>}

      {permissions.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("permissions.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={permissions.length > 0 && selectedIds.size === permissions.length}
                    onChange={(event) => handleSelectAll(event.target.checked)}
                    aria-label={t("permissions.selectAll")}
                    disabled={saving}
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("permissions.columns.pattern")}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("permissions.columns.enabled")}</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t("permissions.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {permissions.map((permission) => (
                <tr key={permission.id} className={selectedIds.has(permission.id) ? "bg-muted/30" : ""}>
                  <td className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-primary"
                      checked={selectedIds.has(permission.id)}
                      onChange={(event) => handleSelect(permission.id, event.target.checked)}
                      aria-label={t("permissions.selectRow", { pattern: permission.pattern })}
                      disabled={saving}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{permission.pattern}</td>
                  <td className="px-3 py-2"><Switch checked={permission.enabled} onCheckedChange={(enabled) => void handleToggle(permission.id, enabled)} disabled={saving} /></td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(permission.id)} disabled={saving}><Trash2 className="h-4 w-4" /><span className="sr-only">{t("permissions.remove")}</span></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: deleteConfirm.id })}
        title={t("permissions.confirmDeleteTitle")}
        description={t("permissions.confirmDeleteDescription")}
        onConfirm={() => deleteConfirm.id && void handleRemove(deleteConfirm.id)}
        loading={saving}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title={t("permissions.confirmBulkDeleteTitle", { count: selectedIds.size })}
        description={t("permissions.confirmBulkDeleteDescription", { count: selectedIds.size })}
        onConfirm={() => void handleBulkRemove()}
        loading={saving}
      />
    </div>
  );
}
