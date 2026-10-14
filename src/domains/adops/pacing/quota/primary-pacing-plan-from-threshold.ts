import { DefaultCreativeThreshold } from "../../creative/mapping/default-creative-threshold.js";
import { normalizeLenientCreativeRequestCode } from "../../creative/mapping/lenient-creative-request-policy.js";
import { PrimaryPacingPlan, newPrimaryPacingPlan } from "./primary-pacing-plan.js";

export function summarizeDefaultCreativeThresholdsForPlan(items: DefaultCreativeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePrimaryPacingPlansFromThreshold(items: DefaultCreativeThreshold[]): PrimaryPacingPlan[] {
  const out: PrimaryPacingPlan[] = [];
  for (const item of items) {
    const derived = newPrimaryPacingPlan(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchPrimaryPacingPlan(item: PrimaryPacingPlan): string {
  return normalizeLenientCreativeRequestCode(item.code);
}
