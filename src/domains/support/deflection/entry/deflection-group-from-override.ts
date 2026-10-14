import { classifyTicketViewBaseline } from "../../ticket-view/baseline/ticket-view-baseline-policy.js";
import { WeightedTicketViewOverride } from "../../ticket-view/baseline/weighted-ticket-view-override.js";
import { DeflectionGroup, newDeflectionGroup } from "./deflection-group.js";

export function summarizeWeightedTicketViewOverridesForGroup(items: WeightedTicketViewOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveDeflectionGroupsFromOverride(items: WeightedTicketViewOverride[]): DeflectionGroup[] {
  const out: DeflectionGroup[] = [];
  for (const item of items) {
    const derived = newDeflectionGroup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateDeflectionGroup(item: DeflectionGroup): string {
  return classifyTicketViewBaseline(item.effectiveTotal());
}
