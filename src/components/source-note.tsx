import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import type { SourceHealth } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<SourceHealth["status"], string> = {
  fresh: "Dades actualitzades",
  stale: "Dades recents",
  empty: "Sense dades ara mateix",
  error: "Font no disponible"
};

export function SourceNote({
  health,
  className
}: {
  health: SourceHealth;
  className?: string;
}) {
  const Icon = health.status === "error" ? AlertCircle : health.status === "empty" ? Clock3 : CheckCircle2;

  return (
    <a
      href={health.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {labels[health.status]}
    </a>
  );
}
