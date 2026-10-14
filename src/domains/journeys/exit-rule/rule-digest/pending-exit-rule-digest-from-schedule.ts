import { classifyBatchedExitRuleMetric } from "../rule-notice/batched-exit-rule-metric-policy.js";
import { LegacyExitRuleSchedule } from "../rule-notice/legacy-exit-rule-schedule.js";
import { PendingExitRuleDigest, newPendingExitRuleDigest } from "./pending-exit-rule-digest.js";

export function summarizeLegacyExitRuleSchedulesForDigest(items: LegacyExitRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePendingExitRuleDigestsFromSchedule(items: LegacyExitRuleSchedule[]): PendingExitRuleDigest[] {
  const out: PendingExitRuleDigest[] = [];
  for (const item of items) {
    const derived = newPendingExitRuleDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePendingExitRuleDigest(item: PendingExitRuleDigest): string {
  return classifyBatchedExitRuleMetric(item.effectiveTotal());
}
