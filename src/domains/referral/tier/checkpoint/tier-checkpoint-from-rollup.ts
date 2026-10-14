import { LenientFraudCheckRollup } from "../../fraud-check/score/lenient-fraud-check-rollup.js";
import { classifyLenientFraudCheckScore } from "../../fraud-check/score/lenient-fraud-check-score-policy.js";
import { TierCheckpoint, newTierCheckpoint } from "./tier-checkpoint.js";

export function summarizeLenientFraudCheckRollupsForCheckpoint(items: LenientFraudCheckRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTierCheckpointsFromRollup(items: LenientFraudCheckRollup[]): TierCheckpoint[] {
  const out: TierCheckpoint[] = [];
  for (const item of items) {
    const derived = newTierCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planTierCheckpoint(item: TierCheckpoint): string {
  return classifyLenientFraudCheckScore(item.measuredValue());
}
