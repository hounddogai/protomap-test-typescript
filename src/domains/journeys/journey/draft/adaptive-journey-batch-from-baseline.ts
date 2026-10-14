import { ExitRuleBaseline } from "../../exit-rule/baseline/exit-rule-baseline.js";
import { normalizePrimaryExitRuleTierCode } from "../../exit-rule/baseline/primary-exit-rule-tier-policy.js";
import { AdaptiveJourneyBatch, newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

export function summarizeExitRuleBaselinesForBatch(items: ExitRuleBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveAdaptiveJourneyBatchesFromBaseline(items: ExitRuleBaseline[]): AdaptiveJourneyBatch[] {
  const out: AdaptiveJourneyBatch[] = [];
  for (const item of items) {
    const derived = newAdaptiveJourneyBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeAdaptiveJourneyBatch(item: AdaptiveJourneyBatch): string {
  return normalizePrimaryExitRuleTierCode(item.code);
}
