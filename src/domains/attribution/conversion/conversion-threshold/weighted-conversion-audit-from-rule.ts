import { CreditRule } from "../../credit/agreement/credit-rule.js";
import { legacyCreditScheduleWeight } from "../../credit/agreement/legacy-credit-schedule-policy.js";
import { WeightedConversionAudit, newWeightedConversionAudit } from "./weighted-conversion-audit.js";

export function summarizeCreditRulesForAudit(items: CreditRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedConversionAuditsFromRule(items: CreditRule[]): WeightedConversionAudit[] {
  const out: WeightedConversionAudit[] = [];
  for (const item of items) {
    const derived = newWeightedConversionAudit(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankWeightedConversionAudit(item: WeightedConversionAudit): number {
  return legacyCreditScheduleWeight(7, true);
}
