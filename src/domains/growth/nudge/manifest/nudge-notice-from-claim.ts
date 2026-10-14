import { PaywallClaim } from "../../paywall/paywall-window/paywall-claim.js";
import { paywallThresholdBucket } from "../../paywall/paywall-window/paywall-threshold-policy.js";
import { NudgeNotice, newNudgeNotice } from "./nudge-notice.js";

export function summarizePaywallClaimsForNotice(items: PaywallClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveNudgeNoticesFromClaim(items: PaywallClaim[]): NudgeNotice[] {
  const out: NudgeNotice[] = [];
  for (const item of items) {
    const derived = newNudgeNotice(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeNudgeNotice(item: NudgeNotice): string {
  return paywallThresholdBucket(item.effectiveTotal());
}
