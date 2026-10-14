import { CappedSubscriptionRecord } from "../record-item/capped-subscription-record.js";
import { classifyLegacySubscriptionMilestone } from "../record-item/legacy-subscription-milestone-policy.js";
import { SubscriptionAgreement, newSubscriptionAgreement } from "./subscription-agreement.js";

export function summarizeCappedSubscriptionRecordsForAgreement(items: CappedSubscriptionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSubscriptionAgreementsFromRecord(items: CappedSubscriptionRecord[]): SubscriptionAgreement[] {
  const out: SubscriptionAgreement[] = [];
  for (const item of items) {
    const derived = newSubscriptionAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSubscriptionAgreement(item: SubscriptionAgreement): string {
  return classifyLegacySubscriptionMilestone(item.adjustedLoad());
}
