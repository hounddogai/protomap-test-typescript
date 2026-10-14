import { LegacyLevelNotice } from "../../level/policy/legacy-level-notice.js";
import { classifyRollingLevelPolicy } from "../../level/policy/rolling-level-policy-policy.js";
import { RewardSummary, newRewardSummary } from "./reward-summary.js";

export function summarizeLegacyLevelNoticesForSummary(items: LegacyLevelNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRewardSummariesFromNotice(items: LegacyLevelNotice[]): RewardSummary[] {
  const out: RewardSummary[] = [];
  for (const item of items) {
    const derived = newRewardSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRewardSummary(item: RewardSummary): string {
  return classifyRollingLevelPolicy(item.effectiveVolume());
}
