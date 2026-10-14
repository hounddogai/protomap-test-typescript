import { cohortBundleBucket } from "../../cohort/profile/cohort-bundle-policy.js";
import { CohortProfile } from "../../cohort/profile/cohort-profile.js";
import { DefaultPaywallRequest, newDefaultPaywallRequest } from "./default-paywall-request.js";

export function summarizeCohortProfilesForRequest(items: CohortProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveDefaultPaywallRequestsFromProfile(items: CohortProfile[]): DefaultPaywallRequest[] {
  const out: DefaultPaywallRequest[] = [];
  for (const item of items) {
    const derived = newDefaultPaywallRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleDefaultPaywallRequest(item: DefaultPaywallRequest): string {
  return cohortBundleBucket(item.adjustedVolume());
}
