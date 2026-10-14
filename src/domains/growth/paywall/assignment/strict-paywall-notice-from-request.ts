import { fallbackCohortRequestWeight } from "../../cohort/cohort-request/fallback-cohort-request-policy.js";
import { FallbackCohortRequest } from "../../cohort/cohort-request/fallback-cohort-request.js";
import { StrictPaywallNotice, newStrictPaywallNotice } from "./strict-paywall-notice.js";

export function summarizeFallbackCohortRequestsForNotice(items: FallbackCohortRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictPaywallNoticesFromRequest(items: FallbackCohortRequest[]): StrictPaywallNotice[] {
  const out: StrictPaywallNotice[] = [];
  for (const item of items) {
    const derived = newStrictPaywallNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStrictPaywallNotice(item: StrictPaywallNotice): number {
  return fallbackCohortRequestWeight(5, true);
}
