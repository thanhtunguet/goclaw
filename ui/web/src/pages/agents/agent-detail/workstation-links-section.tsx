import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  RefreshCw,
  ServerCog,
  Star,
  Trash2,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/stores/use-toast-store";
import { useWorkstationLinks } from "@/pages/workstations/hooks/use-workstation-links";

interface WorkstationLinksSectionProps {
  agentId: string;
}

export function WorkstationLinksSection({ agentId }: WorkstationLinksSectionProps) {
  const { t } = useTranslation("agents");
  const { links, workstations, loading, refresh, linkAgent, unlinkAgent, setDefault } =
    useWorkstationLinks({ mode: "forAgent", agentId });

  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>("");
  const [mutating, setMutating] = useState<string | null>(null);

  // Workstations not yet linked to this agent
  const linkedWorkstationIds = new Set(links.map((l) => l.workstationId));
  const availableWorkstations = workstations.filter((w) => !linkedWorkstationIds.has(w.id));

  async function handleGrant() {
    if (!selectedWorkstationId || mutating !== null) return;
    setMutating("__granting__");
    try {
      await linkAgent(agentId, selectedWorkstationId, links.length === 0);
      setSelectedWorkstationId("");
    } catch {
      toast.error(t("workstations.grantError"));
    } finally {
      setMutating(null);
    }
  }

  async function handleSetDefault(workstationId: string) {
    if (mutating !== null) return;
    setMutating(workstationId);
    try {
      await setDefault(agentId, workstationId);
    } catch {
      toast.error(t("workstations.setDefaultError"));
    } finally {
      setMutating(null);
    }
  }

  async function handleRevoke(workstationId: string, isDefault: boolean) {
    if (mutating !== null) return;
    const message = isDefault
      ? t("workstations.confirmRevokeDefault")
      : t("workstations.confirmRevoke");
    if (!window.confirm(message)) return;

    setMutating(workstationId);
    try {
      await unlinkAgent(agentId, workstationId);
    } catch {
      toast.error(t("workstations.revokeError"));
    } finally {
      setMutating(null);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ServerCog className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t("workstations.sectionTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("workstations.sectionDescription")}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => refresh()}
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Workstation picker */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedWorkstationId}
          onValueChange={setSelectedWorkstationId}
          disabled={availableWorkstations.length === 0 || mutating !== null}
        >
          <SelectTrigger className="flex-1 text-base md:text-sm">
            <SelectValue
              placeholder={
                availableWorkstations.length === 0
                  ? t("workstations.noWorkstationsAvailable")
                  : t("workstations.grantPlaceholder")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableWorkstations.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.name || ws.workstationKey} ({ws.backendType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!selectedWorkstationId || mutating !== null || availableWorkstations.length === 0}
          onClick={handleGrant}
          className="gap-1.5 shrink-0"
        >
          {mutating === "__granting__" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Monitor className="h-3.5 w-3.5" />
          )}
          {t("workstations.grantAccess")}
        </Button>
      </div>

      {/* Empty state */}
      {links.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-12 text-center">
          <p className="font-medium text-muted-foreground">{t("workstations.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("workstations.emptyHint")}</p>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {links.map((link) => {
            const ws = workstations.find((w) => w.id === link.workstationId);
            const displayName = ws
              ? `${ws.name || ws.workstationKey} (${ws.backendType})`
              : link.workstationId;
            const isMutating = mutating === link.workstationId;

            return (
              <li
                key={link.workstationId}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                {/* Star icon for default */}
                <Star
                  className={
                    link.isDefault
                      ? "h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
                      : "h-4 w-4 shrink-0 text-muted-foreground/30"
                  }
                />

                {/* Workstation name + default badge */}
                <span className="flex-1 truncate text-sm font-medium">
                  {displayName}
                </span>
                {link.isDefault && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {t("workstations.defaultBadge")}
                  </Badge>
                )}

                {/* Action buttons or spinner */}
                {isMutating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    {!link.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleSetDefault(link.workstationId)}
                      >
                        <Star className="h-3.5 w-3.5" />
                        {t("workstations.setDefault")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(link.workstationId, link.isDefault)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("workstations.revoke")}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
