import { ticketViewAuditWeight } from "../../ticket-view/audit/ticket-view-audit-policy.js";
import { TicketViewAudit } from "../../ticket-view/audit/ticket-view-audit.js";
import { AdaptiveMacroCheckpoint, newAdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

export function summarizeTicketViewAuditsForCheckpoint(items: TicketViewAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveAdaptiveMacroCheckpointsFromAudit(items: TicketViewAudit[]): AdaptiveMacroCheckpoint[] {
  const out: AdaptiveMacroCheckpoint[] = [];
  for (const item of items) {
    const derived = newAdaptiveMacroCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveMacroCheckpoint(item: AdaptiveMacroCheckpoint): number {
  return ticketViewAuditWeight(1, true);
}
