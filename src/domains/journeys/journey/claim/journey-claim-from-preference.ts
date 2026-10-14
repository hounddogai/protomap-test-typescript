import {
  cappedEnrollmentEstimateWeight,
} from "../../enrollment/enrollment-estimate/capped-enrollment-estimate-policy.js";
import { ManualEnrollmentPreference } from "../../enrollment/enrollment-estimate/manual-enrollment-preference.js";
import { JourneyClaim, newJourneyClaim } from "./journey-claim.js";

export function summarizeManualEnrollmentPreferencesForClaim(items: ManualEnrollmentPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveJourneyClaimsFromPreference(items: ManualEnrollmentPreference[]): JourneyClaim[] {
  const out: JourneyClaim[] = [];
  for (const item of items) {
    const derived = newJourneyClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateJourneyClaim(item: JourneyClaim): number {
  return cappedEnrollmentEstimateWeight(9, true);
}
