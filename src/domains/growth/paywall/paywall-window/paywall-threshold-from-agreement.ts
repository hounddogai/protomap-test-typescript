import { CohortAgreement } from "../../cohort/quota/cohort-agreement.js";
import { normalizeCohortQuotaCode } from "../../cohort/quota/cohort-quota-policy.js";
import { PaywallThreshold, newPaywallThreshold } from "./paywall-threshold.js";

export function summarizeCohortAgreementsForThreshold(items: CohortAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePaywallThresholdsFromAgreement(items: CohortAgreement[]): PaywallThreshold[] {
  const out: PaywallThreshold[] = [];
  for (const item of items) {
    const derived = newPaywallThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePaywallThreshold(item: PaywallThreshold): string {
  return normalizeCohortQuotaCode(item.code);
}
