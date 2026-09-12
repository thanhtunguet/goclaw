import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Link2, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkstationAgents } from "./hooks/use-workstation-agents";
import { useWorkstations } from "./hooks/use-workstations";
import { useAgents } from "../agents/hooks/use-agents";
import type { AgentData } from "@/types/agent";

interface WorkstationAgentsTabProps {
  workstationId: string;
}

export function WorkstationAgentsTab({ workstationId }: WorkstationAgentsTabProps) {
  const { t } = useTranslation("workstations");
  const { agents, loading, error, refresh } = useWorkstationAgents(workstationId);
  const { linkAgent, unlinkAgent } = useWorkstations();
  const { agents: allAgents } = useAgents();
  
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Filter agents that are not already linked
  const linkedAgentIds = new Set(agents.map((a) => a.agentId));
  const availableAgents = allAgents.filter((a) => !linkedAgentIds.has(a.id));

  async function handleLink() {
    if (!selectedAgentId) return;
    setIsLinking(true);
    try {
      await linkAgent(workstationId, selectedAgentId);
      setLinkDialogOpen(false);
      setSelectedAgentId("");
      await refresh();
    } catch (err) {
      console.error("Failed to link agent:", err);
    } finally {
      setIsLinking(false);
    }
  }

  async function handleUnlink() {
    if (!unlinkTarget) return;
    setIsUnlinking(true);
    try {
      await unlinkAgent(workstationId, unlinkTarget);
      setUnlinkTarget(null);
      await refresh();
    } catch (err) {
      console.error("Failed to unlink agent:", err);
    } finally {
      setIsUnlinking(false);
    }
  }

  if (loading && agents.length === 0) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          {t("common:retry", "Retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("agents.title")}</p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw className={"h-3 w-3" + (loading ? " animate-spin" : "")} />
            {t("common:refresh", "Refresh")}
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setLinkDialogOpen(true)}
            disabled={availableAgents.length === 0}
          >
            <Plus className="h-3 w-3" />
            {t("agents.linkAgent")}
          </Button>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-12 text-center">
          <Link2 className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">{t("agents.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("agents.emptyDescription")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {t("agents.columns.agent")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {t("agents.columns.key")}
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {t("agents.columns.status")}
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  {t("agents.columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.agentId} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {agent.displayName || agent.agentKey || agent.agentId}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {agent.agentKey || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">
                      {t("agents.status.linked")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => setUnlinkTarget(agent.agentId)}
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("agents.unlink")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link Agent Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agents.linkDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("agents.linkDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder={t("agents.linkDialog.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.map((agent: AgentData) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.display_name || agent.agent_key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button onClick={handleLink} disabled={!selectedAgentId || isLinking}>
              {isLinking ? t("common:linking", "Linking...") : t("agents.linkDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={unlinkTarget !== null} onOpenChange={() => setUnlinkTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agents.unlinkDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("agents.unlinkDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlinkTarget(null)}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={isUnlinking}
            >
              {isUnlinking ? t("common:unlinking", "Unlinking...") : t("agents.unlinkDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
