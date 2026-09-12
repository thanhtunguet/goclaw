import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UpdateWorkstationParams, Workstation } from "./hooks/use-workstations";
import { buildWorkstationUpdatePayload } from "./workstation-create-dialog-helpers";

interface WorkstationEditDialogProps {
  open: boolean;
  workstation: Workstation | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, params: UpdateWorkstationParams) => Promise<void>;
}

export function WorkstationEditDialog({
  open,
  workstation,
  onOpenChange,
  onSave,
}: WorkstationEditDialogProps) {
  const { t } = useTranslation("workstations");

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !workstation) return;
    setName(workstation.name);
    setActive(workstation.active);
    setFieldError(null);
  }, [open, workstation]);

  if (!workstation) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const currentWorkstation = workstation;
    if (!currentWorkstation) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldError(t("editDialog.errors.nameRequired"));
      return;
    }

    const payload = buildWorkstationUpdatePayload({
      id: currentWorkstation.id,
      key: currentWorkstation.workstationKey,
      name: trimmedName,
      backend: currentWorkstation.backendType,
      active,
    });

    setFieldError(null);
    setSubmitting(true);
    try {
      await onSave(payload.id, payload.updates);
      onOpenChange(false);
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : t("editDialog.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>{t("editDialog.description", { name: workstation.name })}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="edit-ws-name">{t("editDialog.nameLabel")}</Label>
            <Input
              id="edit-ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("editDialog.namePlaceholder")}
              className="text-base md:text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{t("editDialog.activeLabel")}</p>
              <p className="text-xs text-muted-foreground">{t("status." + (active ? "active" : "inactive"))}</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t("columns.key")}: </span>
            <span className="font-mono text-xs">{workstation.workstationKey}</span>
            <span className="ml-3">•</span>
            <span className="ml-3">{t(`backend.${workstation.backendType}`)}</span>
          </div>

          {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("editDialog.cancel")}
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              <Save className="h-3.5 w-3.5" />
              {t("editDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
