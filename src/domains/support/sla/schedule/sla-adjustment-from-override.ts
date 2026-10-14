import { classifyTicketViewOverride } from "../../ticket-view/agreement/ticket-view-override-policy.js";
import { TicketViewOverride } from "../../ticket-view/agreement/ticket-view-override.js";
import { SlaAdjustment, newSlaAdjustment } from "./sla-adjustment.js";

export function summarizeTicketViewOverridesForAdjustment(items: TicketViewOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveSlaAdjustmentsFromOverride(items: TicketViewOverride[]): SlaAdjustment[] {
  const out: SlaAdjustment[] = [];
  for (const item of items) {
    const derived = newSlaAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceSlaAdjustment(item: SlaAdjustment): string {
  return classifyTicketViewOverride(item.effectiveExposure());
}
