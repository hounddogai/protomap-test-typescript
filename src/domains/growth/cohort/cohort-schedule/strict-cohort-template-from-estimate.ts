import { normalizeAdaptivePaywallAgreementCode } from "../../paywall/estimate/adaptive-paywall-agreement-policy.js";
import { PaywallEstimate } from "../../paywall/estimate/paywall-estimate.js";
import { StrictCohortTemplate, newStrictCohortTemplate } from "./strict-cohort-template.js";

export function summarizePaywallEstimatesForTemplate(items: PaywallEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStrictCohortTemplatesFromEstimate(items: PaywallEstimate[]): StrictCohortTemplate[] {
  const out: StrictCohortTemplate[] = [];
  for (const item of items) {
    const derived = newStrictCohortTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveStrictCohortTemplate(item: StrictCohortTemplate): string {
  return normalizeAdaptivePaywallAgreementCode(item.code);
}
