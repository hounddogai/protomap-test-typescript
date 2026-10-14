import { defaultEscalationManifestWeight } from "../../escalation/plan/default-escalation-manifest-policy.js";
import { EscalationPlan } from "../../escalation/plan/escalation-plan.js";
import { TicketViewMapping, newTicketViewMapping } from "./ticket-view-mapping.js";

export function summarizeEscalationPlansForMapping(items: EscalationPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveTicketViewMappingsFromPlan(items: EscalationPlan[]): TicketViewMapping[] {
  const out: TicketViewMapping[] = [];
  for (const item of items) {
    const derived = newTicketViewMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeTicketViewMapping(item: TicketViewMapping): number {
  return defaultEscalationManifestWeight(7, true);
}
