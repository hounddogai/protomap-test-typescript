import { CappedBidRuleCycle } from "../../bid-rule/cycle/capped-bid-rule-cycle.js";
import { normalizePendingBidRulePlanCode } from "../../bid-rule/cycle/pending-bid-rule-plan-policy.js";
import { PrimaryFlightOverride, newPrimaryFlightOverride } from "./primary-flight-override.js";

export function summarizeCappedBidRuleCyclesForOverride(items: CappedBidRuleCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePrimaryFlightOverridesFromCycle(items: CappedBidRuleCycle[]): PrimaryFlightOverride[] {
  const out: PrimaryFlightOverride[] = [];
  for (const item of items) {
    const derived = newPrimaryFlightOverride(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planPrimaryFlightOverride(item: PrimaryFlightOverride): string {
  return normalizePendingBidRulePlanCode(item.code);
}
