import { classifyBatchedInsightGroup } from "../../insight/assignment/batched-insight-group-policy.js";
import { SeasonalInsightAssignment } from "../../insight/assignment/seasonal-insight-assignment.js";
import { TieredPostThreshold, newTieredPostThreshold } from "./tiered-post-threshold.js";

export function summarizeSeasonalInsightAssignmentsForThreshold(items: SeasonalInsightAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredPostThresholdsFromAssignment(items: SeasonalInsightAssignment[]): TieredPostThreshold[] {
  const out: TieredPostThreshold[] = [];
  for (const item of items) {
    const derived = newTieredPostThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredPostThreshold(item: TieredPostThreshold): string {
  return classifyBatchedInsightGroup(item.measuredValue());
}
