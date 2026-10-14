import { normalizePaywallEstimateCode } from "../estimate/paywall-estimate-policy.js";
import { PaywallEstimate } from "../estimate/paywall-estimate.js";
import { RollingPaywallAgreement, newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

export function summarizePaywallEstimatesForAgreement(items: PaywallEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRollingPaywallAgreementsFromEstimate(items: PaywallEstimate[]): RollingPaywallAgreement[] {
  const out: RollingPaywallAgreement[] = [];
  for (const item of items) {
    const derived = newRollingPaywallAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRollingPaywallAgreement(item: RollingPaywallAgreement): string {
  return normalizePaywallEstimateCode(item.code);
}
