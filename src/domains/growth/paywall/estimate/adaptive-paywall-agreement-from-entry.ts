import { ActivationEntry } from "../../activation/capped-activation-review/activation-entry.js";
import {
  seasonalActivationReviewWeight,
} from "../../activation/capped-activation-review/seasonal-activation-review-policy.js";
import { AdaptivePaywallAgreement, newAdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

export function summarizeActivationEntriesForAgreement(items: ActivationEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveAdaptivePaywallAgreementsFromEntry(items: ActivationEntry[]): AdaptivePaywallAgreement[] {
  const out: AdaptivePaywallAgreement[] = [];
  for (const item of items) {
    const derived = newAdaptivePaywallAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptivePaywallAgreement(item: AdaptivePaywallAgreement): number {
  return seasonalActivationReviewWeight(4, true);
}
