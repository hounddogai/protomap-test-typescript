import { ActivationSlot } from "../../activation/tier/activation-slot.js";
import { classifyCappedActivationLedger } from "../../activation/tier/capped-activation-ledger-policy.js";
import { PaywallPolicy, newPaywallPolicy } from "./paywall-policy.js";

export function summarizeActivationSlotsForPolicy(items: ActivationSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePaywallPoliciesFromSlot(items: ActivationSlot[]): PaywallPolicy[] {
  const out: PaywallPolicy[] = [];
  for (const item of items) {
    const derived = newPaywallPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPaywallPolicy(item: PaywallPolicy): string {
  return classifyCappedActivationLedger(item.weightedTotal());
}
