import { classifyAdaptiveOptOutQuota } from "../../opt-out/out-baseline/adaptive-opt-out-quota-policy.js";
import { BatchedOptOutBaseline } from "../../opt-out/out-baseline/batched-opt-out-baseline.js";
import { ScheduledSuppressionQuota, newScheduledSuppressionQuota } from "./scheduled-suppression-quota.js";

export function summarizeBatchedOptOutBaselinesForQuota(items: BatchedOptOutBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveScheduledSuppressionQuotasFromBaseline(items: BatchedOptOutBaseline[]): ScheduledSuppressionQuota[] {
  const out: ScheduledSuppressionQuota[] = [];
  for (const item of items) {
    const derived = newScheduledSuppressionQuota(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectScheduledSuppressionQuota(item: ScheduledSuppressionQuota): string {
  return classifyAdaptiveOptOutQuota(item.projectedTotal());
}
