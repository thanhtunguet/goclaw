import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useWorkstationPermissions } from "./hooks/use-workstation-permissions";

interface WorkstationPermissionsTabProps {
  workstationId: string;
}

export function WorkstationPermissionsTab({ workstationId }: WorkstationPermissionsTabProps) {
  const { t } = useTranslation("workstations");
  const { permissions, loading, error, refresh, add, remove, setEnabled } = useWorkstationPermissions(workstationId);
  const [pattern, setPattern] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAdd() {
    const value = pattern.trim();
    if (!value || value === "*") {
      setActionError(t("permissions.errors.invalidPattern"));
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await add(value);
      setPattern("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("permissions.errors.addFailed"));
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

  async function handleRemove(id: string) {
    setSaving(true);
    setActionError(null);
    try {
      await remove(id);
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
          placeholder={t("permissions.patternPlaceholder")}
          className="text-base md:text-sm"
          aria-label={t("permissions.patternLabel")}
          disabled={saving}
        />
        <Button className="gap-1" onClick={() => void handleAdd()} disabled={saving || !pattern.trim()}>
          <Plus className="h-4 w-4" />
          {t("permissions.add")}
        </Button>
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
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("permissions.columns.pattern")}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("permissions.columns.enabled")}</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t("permissions.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="px-3 py-2 font-mono text-xs">{permission.pattern}</td>
                  <td className="px-3 py-2"><Switch checked={permission.enabled} onCheckedChange={(enabled) => void handleToggle(permission.id, enabled)} disabled={saving} /></td>
                  <td className="px-3 py-2 text-right"><Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => void handleRemove(permission.id)} disabled={saving}><Trash2 className="h-4 w-4" /><span className="sr-only">{t("permissions.remove")}</span></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
