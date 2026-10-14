import { defaultEscalationManifestWeight } from "../../escalation/plan/default-escalation-manifest-policy.js";
import { PrimaryEscalationAdjustment } from "../../escalation/plan/primary-escalation-adjustment.js";
import { WeightedDeflectionEntry, newWeightedDeflectionEntry } from "./weighted-deflection-entry.js";

export function summarizePrimaryEscalationAdjustmentsForEntry(items: PrimaryEscalationAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveWeightedDeflectionEntriesFromAdjustment(items: PrimaryEscalationAdjustment[]): WeightedDeflectionEntry[] {
  const out: WeightedDeflectionEntry[] = [];
  for (const item of items) {
    const derived = newWeightedDeflectionEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planWeightedDeflectionEntry(item: WeightedDeflectionEntry): number {
  return defaultEscalationManifestWeight(9, true);
}
