import { globalRewardBaselineWeight } from "../../reward/baseline/global-reward-baseline-policy.js";
import { GlobalRewardBaseline } from "../../reward/baseline/global-reward-baseline.js";
import { DefaultStreakSummary, newDefaultStreakSummary } from "./default-streak-summary.js";

export function summarizeGlobalRewardBaselinesForSummary(items: GlobalRewardBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultStreakSummariesFromBaseline(items: GlobalRewardBaseline[]): DefaultStreakSummary[] {
  const out: DefaultStreakSummary[] = [];
  for (const item of items) {
    const derived = newDefaultStreakSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDefaultStreakSummary(item: DefaultStreakSummary): number {
  return globalRewardBaselineWeight(6, true);
}
