import { AdaptiveFraudCheckScore } from "../../fraud-check/batched-check-score/adaptive-fraud-check-score.js";
import { classifyFraudCheckEntry } from "../../fraud-check/batched-check-score/fraud-check-entry-policy.js";
import { TierPlan, newTierPlan } from "./tier-plan.js";

export function summarizeAdaptiveFraudCheckScoresForPlan(items: AdaptiveFraudCheckScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTierPlansFromScore(items: AdaptiveFraudCheckScore[]): TierPlan[] {
  const out: TierPlan[] = [];
  for (const item of items) {
    const derived = newTierPlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreTierPlan(item: TierPlan): string {
  return classifyFraudCheckEntry(item.netExposure());
}
