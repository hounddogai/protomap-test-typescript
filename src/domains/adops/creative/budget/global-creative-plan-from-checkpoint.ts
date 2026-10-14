import { BatchedFlightCheckpoint } from "../../flight/record-item/batched-flight-checkpoint.js";
import { normalizeFlightMilestoneCode } from "../../flight/record-item/flight-milestone-policy.js";
import { GlobalCreativePlan, newGlobalCreativePlan } from "./global-creative-plan.js";

export function summarizeBatchedFlightCheckpointsForPlan(items: BatchedFlightCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveGlobalCreativePlansFromCheckpoint(items: BatchedFlightCheckpoint[]): GlobalCreativePlan[] {
  const out: GlobalCreativePlan[] = [];
  for (const item of items) {
    const derived = newGlobalCreativePlan(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeGlobalCreativePlan(item: GlobalCreativePlan): string {
  return normalizeFlightMilestoneCode(item.code);
}
