import { StepCheckpoint } from "../../step/group/step-checkpoint.js";
import { tieredStepMilestoneWeight } from "../../step/group/tiered-step-milestone-policy.js";
import { RollingWaitBaseline, newRollingWaitBaseline } from "./rolling-wait-baseline.js";

export function summarizeStepCheckpointsForBaseline(items: StepCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRollingWaitBaselinesFromCheckpoint(items: StepCheckpoint[]): RollingWaitBaseline[] {
  const out: RollingWaitBaseline[] = [];
  for (const item of items) {
    const derived = newRollingWaitBaseline(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRollingWaitBaseline(item: RollingWaitBaseline): number {
  return tieredStepMilestoneWeight(4, true);
}
