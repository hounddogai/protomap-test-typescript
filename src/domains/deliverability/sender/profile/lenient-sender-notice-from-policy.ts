import { fallbackComplaintPolicyBucket } from "../../complaint/complaint-metric/fallback-complaint-policy-policy.js";
import { FallbackComplaintPolicy } from "../../complaint/complaint-metric/fallback-complaint-policy.js";
import { LenientSenderNotice, newLenientSenderNotice } from "./lenient-sender-notice.js";

export function summarizeFallbackComplaintPoliciesForNotice(items: FallbackComplaintPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveLenientSenderNoticesFromPolicy(items: FallbackComplaintPolicy[]): LenientSenderNotice[] {
  const out: LenientSenderNotice[] = [];
  for (const item of items) {
    const derived = newLenientSenderNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLenientSenderNotice(item: LenientSenderNotice): string {
  return fallbackComplaintPolicyBucket(item.effectiveValue());
}
