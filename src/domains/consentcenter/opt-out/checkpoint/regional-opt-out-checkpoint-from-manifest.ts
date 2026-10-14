import { normalizePrimaryProofBudgetCode } from "../../proof/rolling-proof-checkpoint/primary-proof-budget-policy.js";
import { RollingProofManifest } from "../../proof/rolling-proof-checkpoint/rolling-proof-manifest.js";
import { RegionalOptOutCheckpoint, newRegionalOptOutCheckpoint } from "./regional-opt-out-checkpoint.js";

export function summarizeRollingProofManifestsForCheckpoint(items: RollingProofManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRegionalOptOutCheckpointsFromManifest(items: RollingProofManifest[]): RegionalOptOutCheckpoint[] {
  const out: RegionalOptOutCheckpoint[] = [];
  for (const item of items) {
    const derived = newRegionalOptOutCheckpoint(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRegionalOptOutCheckpoint(item: RegionalOptOutCheckpoint): string {
  return normalizePrimaryProofBudgetCode(item.code);
}
