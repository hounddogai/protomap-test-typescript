import { tieredBranchAdjustmentBucket } from "../../branch/adjustment/tiered-branch-adjustment-policy.js";
import { TieredBranchAdjustment } from "../../branch/adjustment/tiered-branch-adjustment.js";
import { LegacyStepScore, newLegacyStepScore } from "./legacy-step-score.js";

export function summarizeTieredBranchAdjustmentsForScore(items: TieredBranchAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLegacyStepScoresFromAdjustment(items: TieredBranchAdjustment[]): LegacyStepScore[] {
  const out: LegacyStepScore[] = [];
  for (const item of items) {
    const derived = newLegacyStepScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchLegacyStepScore(item: LegacyStepScore): string {
  return tieredBranchAdjustmentBucket(item.weightedLoad());
}
