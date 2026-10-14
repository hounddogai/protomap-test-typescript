import { deflectionEntryBucket } from "../../deflection/entry/deflection-entry-policy.js";
import { DeflectionGroup } from "../../deflection/entry/deflection-group.js";
import { PrimaryEscalationAdjustment, newPrimaryEscalationAdjustment } from "./primary-escalation-adjustment.js";

export function summarizeDeflectionGroupsForAdjustment(items: DeflectionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePrimaryEscalationAdjustmentsFromGroup(items: DeflectionGroup[]): PrimaryEscalationAdjustment[] {
  const out: PrimaryEscalationAdjustment[] = [];
  for (const item of items) {
    const derived = newPrimaryEscalationAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryEscalationAdjustment(item: PrimaryEscalationAdjustment): string {
  return deflectionEntryBucket(item.projectedValue());
}
