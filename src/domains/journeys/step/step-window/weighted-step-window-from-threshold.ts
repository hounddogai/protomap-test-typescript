import { exitRuleThresholdBucket } from "../../exit-rule/threshold/exit-rule-threshold-policy.js";
import { ExitRuleThreshold } from "../../exit-rule/threshold/exit-rule-threshold.js";
import { WeightedStepWindow, newWeightedStepWindow } from "./weighted-step-window.js";

export function summarizeExitRuleThresholdsForWindow(items: ExitRuleThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveWeightedStepWindowsFromThreshold(items: ExitRuleThreshold[]): WeightedStepWindow[] {
  const out: WeightedStepWindow[] = [];
  for (const item of items) {
    const derived = newWeightedStepWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedStepWindow(item: WeightedStepWindow): string {
  return exitRuleThresholdBucket(item.effectiveExposure());
}
