import { optOutCycleWeight } from "../../opt-out/override-item/opt-out-cycle-policy.js";
import { PendingOptOutAdjustment } from "../../opt-out/override-item/pending-opt-out-adjustment.js";
import { RollingSuppressionThreshold, newRollingSuppressionThreshold } from "./rolling-suppression-threshold.js";

export function summarizePendingOptOutAdjustmentsForThreshold(items: PendingOptOutAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRollingSuppressionThresholdsFromAdjustment(items: PendingOptOutAdjustment[]): RollingSuppressionThreshold[] {
  const out: RollingSuppressionThreshold[] = [];
  for (const item of items) {
    const derived = newRollingSuppressionThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRollingSuppressionThreshold(item: RollingSuppressionThreshold): number {
  return optOutCycleWeight(9, true);
}
