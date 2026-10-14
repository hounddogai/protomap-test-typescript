import { deflectionSlotWeight } from "../slot/deflection-slot-policy.js";
import { WeightedDeflectionAudit } from "../slot/weighted-deflection-audit.js";
import { DeflectionSnapshot, newDeflectionSnapshot } from "./deflection-snapshot.js";

export function summarizeWeightedDeflectionAuditsForSnapshot(items: WeightedDeflectionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveDeflectionSnapshotsFromAudit(items: WeightedDeflectionAudit[]): DeflectionSnapshot[] {
  const out: DeflectionSnapshot[] = [];
  for (const item of items) {
    const derived = newDeflectionSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeDeflectionSnapshot(item: DeflectionSnapshot): number {
  return deflectionSlotWeight(4, true);
}
