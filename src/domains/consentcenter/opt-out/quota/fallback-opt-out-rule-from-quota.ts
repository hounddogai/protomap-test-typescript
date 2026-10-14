import { normalizeDoubleOptInQuotaCode } from "../../double-opt-in/batch/double-opt-in-quota-policy.js";
import { DoubleOptInQuota } from "../../double-opt-in/batch/double-opt-in-quota.js";
import { FallbackOptOutRule, newFallbackOptOutRule } from "./fallback-opt-out-rule.js";

export function summarizeDoubleOptInQuotasForRule(items: DoubleOptInQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFallbackOptOutRulesFromQuota(items: DoubleOptInQuota[]): FallbackOptOutRule[] {
  const out: FallbackOptOutRule[] = [];
  for (const item of items) {
    const derived = newFallbackOptOutRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleFallbackOptOutRule(item: FallbackOptOutRule): string {
  return normalizeDoubleOptInQuotaCode(item.code);
}
