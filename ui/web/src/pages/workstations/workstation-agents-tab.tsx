import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Star,
  Trash2,
  UserCheck,
  UserPlus,
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
import { useWs } from "@/hooks/use-ws";
import { Methods } from "@/api/protocol";
import {
  useWorkstationLinks,
} from "./hooks/use-workstation-links";

interface WorkstationAgentsTabProps {
  workstationId: string;
}

export function WorkstationAgentsTab({ workstationId }: WorkstationAgentsTabProps) {
  const { t } = useTranslation("workstations");
  const ws = useWs();
  const { links, agents, loading, linkAgent, unlinkAgent, setDefault } =
    useWorkstationLinks({ mode: "forWorkstation", workstationId });

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [mutating, setMutating] = useState<string | null>(null);

  // Agents not yet linked to this workstation
  const linkedAgentIds = new Set(links.map((l) => l.agentId));
  const availableAgents = agents.filter((a) => !linkedAgentIds.has(a.id));

  async function handleLink() {
    if (!selectedAgentId) return;
    setMutating(selectedAgentId);
    try {
      const agentLinksRes = await ws.call<{ links: { agentId: string }[] }>(
        Methods.WORKSTATIONS_LINKS_FOR_AGENT,
        { agentId: selectedAgentId },
      );
      const isFirstLinkForAgent = (agentLinksRes.links ?? []).length === 0;

      await linkAgent(selectedAgentId, workstationId, isFirstLinkForAgent);
      setSelectedAgentId("");
    } catch {
      toast.error(t("agents.linkError"));
    } finally {
      setMutating(null);
    }
  }

  async function handleSetDefault(agentId: string) {
    setMutating(agentId);
    try {
      await setDefault(agentId, workstationId);
    } catch {
      toast.error(t("agents.setDefaultError"));
    } finally {
      setMutating(null);
    }
  }

  async function handleUnlink(agentId: string, isDefault: boolean) {
    const message = isDefault
      ? t("agents.confirmUnlinkDefault")
      : t("agents.confirmUnlink");
    if (!window.confirm(message)) return;

    setMutating(agentId);
    try {
      await unlinkAgent(agentId, workstationId);
    } catch {
      toast.error(t("agents.unlinkError"));
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("agents.sectionTitle")}</p>
      </div>

      {/* Agent picker */}
      <div className="flex items-center gap-2">
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="flex-1 text-base md:text-sm">
            <SelectValue
              placeholder={
                availableAgents.length === 0
                  ? t("agents.noAgentsAvailable")
                  : t("agents.linkPlaceholder")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableAgents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.display_name || a.agent_key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!selectedAgentId || mutating !== null}
          onClick={handleLink}
          className="gap-1.5 shrink-0"
        >
          {mutating === selectedAgentId ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {t("agents.link")}
        </Button>
      </div>

      {/* Empty state */}
      {links.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-12 text-center">
          <p className="font-medium text-muted-foreground">{t("agents.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("agents.emptyHint")}</p>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {links.map((link) => {
            const agent = agents.find((a) => a.id === link.agentId);
            const name = agent
              ? agent.display_name || agent.agent_key
              : link.agentId;
            const isMutating = mutating === link.agentId;

            return (
              <li
                key={link.agentId}
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

                {/* Agent name + default badge */}
                <span className="flex-1 truncate text-sm font-medium">
                  {name}
                </span>
                {link.isDefault && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {t("agents.defaultBadge")}
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
                        onClick={() => handleSetDefault(link.agentId)}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {t("agents.setDefault")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleUnlink(link.agentId, link.isDefault)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("agents.unlink")}
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
