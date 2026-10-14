import { strictQueueTargetWeight } from "../../queue/queue-estimate/strict-queue-target-policy.js";
import { StrictQueueTarget } from "../../queue/queue-estimate/strict-queue-target.js";
import { TieredPostThreshold, newTieredPostThreshold } from "./tiered-post-threshold.js";

export function summarizeStrictQueueTargetsForThreshold(items: StrictQueueTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveTieredPostThresholdsFromTarget(items: StrictQueueTarget[]): TieredPostThreshold[] {
  const out: TieredPostThreshold[] = [];
  for (const item of items) {
    const derived = newTieredPostThreshold(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredPostThresholdExtra(item: TieredPostThreshold): number {
  return strictQueueTargetWeight(4, true);
}
