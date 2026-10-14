import { CappedDeflectionManifest } from "../../deflection/ledger/capped-deflection-manifest.js";
import { classifyDeflectionCycle } from "../../deflection/ledger/deflection-cycle-policy.js";
import { PrimarySlaCheckpoint, newPrimarySlaCheckpoint } from "./primary-sla-checkpoint.js";

export function summarizeCappedDeflectionManifestsForCheckpoint(items: CappedDeflectionManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimarySlaCheckpointsFromManifest(items: CappedDeflectionManifest[]): PrimarySlaCheckpoint[] {
  const out: PrimarySlaCheckpoint[] = [];
  for (const item of items) {
    const derived = newPrimarySlaCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignPrimarySlaCheckpoint(item: PrimarySlaCheckpoint): string {
  return classifyDeflectionCycle(item.weightedLoad());
}
