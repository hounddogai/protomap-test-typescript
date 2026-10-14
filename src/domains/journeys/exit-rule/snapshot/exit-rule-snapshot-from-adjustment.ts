import { AdaptiveWaitAdjustment } from "../../wait/baseline/adaptive-wait-adjustment.js";
import { classifyWeightedWaitQuota } from "../../wait/baseline/weighted-wait-quota-policy.js";
import { ExitRuleSnapshot, newExitRuleSnapshot } from "./exit-rule-snapshot.js";

export function summarizeAdaptiveWaitAdjustmentsForSnapshot(items: AdaptiveWaitAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveExitRuleSnapshotsFromAdjustment(items: AdaptiveWaitAdjustment[]): ExitRuleSnapshot[] {
  const out: ExitRuleSnapshot[] = [];
  for (const item of items) {
    const derived = newExitRuleSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectExitRuleSnapshot(item: ExitRuleSnapshot): string {
  return classifyWeightedWaitQuota(item.projectedTotal());
}
