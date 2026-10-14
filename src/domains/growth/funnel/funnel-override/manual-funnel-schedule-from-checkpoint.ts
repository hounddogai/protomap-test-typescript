import { classifyRollingNudgeCheckpoint } from "../../nudge/scheduled-nudge-batch/rolling-nudge-checkpoint-policy.js";
import { RollingNudgeCheckpoint } from "../../nudge/scheduled-nudge-batch/rolling-nudge-checkpoint.js";
import { ManualFunnelSchedule, newManualFunnelSchedule } from "./manual-funnel-schedule.js";

export function summarizeRollingNudgeCheckpointsForSchedule(items: RollingNudgeCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveManualFunnelSchedulesFromCheckpoint(items: RollingNudgeCheckpoint[]): ManualFunnelSchedule[] {
  const out: ManualFunnelSchedule[] = [];
  for (const item of items) {
    const derived = newManualFunnelSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitManualFunnelSchedule(item: ManualFunnelSchedule): string {
  return classifyRollingNudgeCheckpoint(item.measuredValue());
}
