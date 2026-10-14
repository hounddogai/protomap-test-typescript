import { BatchedLevelEstimate } from "../../level/target/batched-level-estimate.js";
import { normalizeLevelScheduleCode } from "../../level/target/level-schedule-policy.js";
import { TieredBadgeSummary, newTieredBadgeSummary } from "./tiered-badge-summary.js";

export function summarizeBatchedLevelEstimatesForSummary(items: BatchedLevelEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredBadgeSummariesFromEstimate(items: BatchedLevelEstimate[]): TieredBadgeSummary[] {
  const out: TieredBadgeSummary[] = [];
  for (const item of items) {
    const derived = newTieredBadgeSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTieredBadgeSummary(item: TieredBadgeSummary): string {
  return normalizeLevelScheduleCode(item.code);
}
