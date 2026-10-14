import { stepRollupBucket } from "../step-window/step-rollup-policy.js";
import { WeightedStepWindow } from "../step-window/weighted-step-window.js";
import { SeasonalStepCycle, newSeasonalStepCycle } from "./seasonal-step-cycle.js";

export function summarizeWeightedStepWindowsForCycle(items: WeightedStepWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveSeasonalStepCyclesFromWindow(items: WeightedStepWindow[]): SeasonalStepCycle[] {
  const out: SeasonalStepCycle[] = [];
  for (const item of items) {
    const derived = newSeasonalStepCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applySeasonalStepCycle(item: SeasonalStepCycle): string {
  return stepRollupBucket(item.projectedExposure());
}
