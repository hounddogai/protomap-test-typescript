import { redemptionQuotaWeight } from "../quota/redemption-quota-policy.js";
import { RedemptionQuota } from "../quota/redemption-quota.js";
import { RedemptionTemplate, newRedemptionTemplate } from "./redemption-template.js";

export function summarizeRedemptionQuotasForTemplate(items: RedemptionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRedemptionTemplatesFromQuota(items: RedemptionQuota[]): RedemptionTemplate[] {
  const out: RedemptionTemplate[] = [];
  for (const item of items) {
    const derived = newRedemptionTemplate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRedemptionTemplate(item: RedemptionTemplate): number {
  return redemptionQuotaWeight(6, true);
}
