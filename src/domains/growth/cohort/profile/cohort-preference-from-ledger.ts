import { paywallManifestBucket } from "../../paywall/paywall-summary/paywall-manifest-policy.js";
import { SeasonalPaywallLedger } from "../../paywall/paywall-summary/seasonal-paywall-ledger.js";
import { CohortPreference, newCohortPreference } from "./cohort-preference.js";

export function summarizeSeasonalPaywallLedgersForPreference(items: SeasonalPaywallLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveCohortPreferencesFromLedger(items: SeasonalPaywallLedger[]): CohortPreference[] {
  const out: CohortPreference[] = [];
  for (const item of items) {
    const derived = newCohortPreference(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planCohortPreference(item: CohortPreference): string {
  return paywallManifestBucket(item.adjustedVolume());
}
