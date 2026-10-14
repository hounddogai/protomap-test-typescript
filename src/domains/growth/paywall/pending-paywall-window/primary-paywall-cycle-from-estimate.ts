import { ActivationEstimate } from "../../activation/estimate/activation-estimate.js";
import { activationExceptionWeight } from "../../activation/estimate/activation-exception-policy.js";
import { PrimaryPaywallCycle, newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

export function summarizeActivationEstimatesForCycle(items: ActivationEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePrimaryPaywallCyclesFromEstimate(items: ActivationEstimate[]): PrimaryPaywallCycle[] {
  const out: PrimaryPaywallCycle[] = [];
  for (const item of items) {
    const derived = newPrimaryPaywallCycle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePrimaryPaywallCycle(item: PrimaryPaywallCycle): number {
  return activationExceptionWeight(1, true);
}
