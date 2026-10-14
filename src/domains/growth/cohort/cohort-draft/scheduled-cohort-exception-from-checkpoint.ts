import { cappedNudgeScheduleWeight } from "../../nudge/checkpoint/capped-nudge-schedule-policy.js";
import { NudgeCheckpoint } from "../../nudge/checkpoint/nudge-checkpoint.js";
import { ScheduledCohortException, newScheduledCohortException } from "./scheduled-cohort-exception.js";

export function summarizeNudgeCheckpointsForException(items: NudgeCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveScheduledCohortExceptionsFromCheckpoint(items: NudgeCheckpoint[]): ScheduledCohortException[] {
  const out: ScheduledCohortException[] = [];
  for (const item of items) {
    const derived = newScheduledCohortException(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyScheduledCohortException(item: ScheduledCohortException): number {
  return cappedNudgeScheduleWeight(2, true);
}
