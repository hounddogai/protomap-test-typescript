import {
  adaptiveRetentionPreferenceWeight,
} from "../../retention/retention-quota/adaptive-retention-preference-policy.js";
import { StrictRetentionQuota } from "../../retention/retention-quota/strict-retention-quota.js";
import { PaywallNotice, newPaywallNotice } from "./paywall-notice.js";

export function summarizeStrictRetentionQuotasForNotice(items: StrictRetentionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePaywallNoticesFromQuota(items: StrictRetentionQuota[]): PaywallNotice[] {
  const out: PaywallNotice[] = [];
  for (const item of items) {
    const derived = newPaywallNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computePaywallNotice(item: PaywallNotice): number {
  return adaptiveRetentionPreferenceWeight(9, true);
}
