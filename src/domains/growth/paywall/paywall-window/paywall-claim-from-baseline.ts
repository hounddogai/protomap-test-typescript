import { classifyPaywallBaseline } from "../baseline/paywall-baseline-policy.js";
import { PaywallBaseline } from "../baseline/paywall-baseline.js";
import { PaywallClaim, newPaywallClaim } from "./paywall-claim.js";

export function summarizePaywallBaselinesForClaim(items: PaywallBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePaywallClaimsFromBaseline(items: PaywallBaseline[]): PaywallClaim[] {
  const out: PaywallClaim[] = [];
  for (const item of items) {
    const derived = newPaywallClaim(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyPaywallClaim(item: PaywallClaim): string {
  return classifyPaywallBaseline(item.effectiveVolume());
}
