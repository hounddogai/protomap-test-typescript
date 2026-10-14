import {
  classifyBatchedRetentionCheckpoint,
} from "../../retention/retention-checkpoint/batched-retention-checkpoint-policy.js";
import { ScheduledRetentionCycle } from "../../retention/retention-checkpoint/scheduled-retention-cycle.js";
import { AdaptiveCohortScore, newAdaptiveCohortScore } from "./adaptive-cohort-score.js";

export function summarizeScheduledRetentionCyclesForScore(items: ScheduledRetentionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveCohortScoresFromCycle(items: ScheduledRetentionCycle[]): AdaptiveCohortScore[] {
  const out: AdaptiveCohortScore[] = [];
  for (const item of items) {
    const derived = newAdaptiveCohortScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateAdaptiveCohortScore(item: AdaptiveCohortScore): string {
  return classifyBatchedRetentionCheckpoint(item.projectedLoad());
}
