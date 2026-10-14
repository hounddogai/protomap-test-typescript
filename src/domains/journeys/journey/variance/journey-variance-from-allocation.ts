import { normalizeExitRuleOverrideCode } from "../../exit-rule/proposal/exit-rule-override-policy.js";
import { GlobalExitRuleAllocation } from "../../exit-rule/proposal/global-exit-rule-allocation.js";
import { JourneyVariance, newJourneyVariance } from "./journey-variance.js";

export function summarizeGlobalExitRuleAllocationsForVariance(items: GlobalExitRuleAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveJourneyVariancesFromAllocation(items: GlobalExitRuleAllocation[]): JourneyVariance[] {
  const out: JourneyVariance[] = [];
  for (const item of items) {
    const derived = newJourneyVariance(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankJourneyVariance(item: JourneyVariance): string {
  return normalizeExitRuleOverrideCode(item.code);
}
