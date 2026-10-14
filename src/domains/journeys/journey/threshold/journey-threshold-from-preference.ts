import { normalizeBatchedJourneyPolicyCode } from "../budget/batched-journey-policy-policy.js";
import { JourneyPreference } from "../budget/journey-preference.js";
import { JourneyThreshold, newJourneyThreshold } from "./journey-threshold.js";

export function summarizeJourneyPreferencesForThreshold(items: JourneyPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveJourneyThresholdsFromPreference(items: JourneyPreference[]): JourneyThreshold[] {
  const out: JourneyThreshold[] = [];
  for (const item of items) {
    const derived = newJourneyThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeJourneyThreshold(item: JourneyThreshold): string {
  return normalizeBatchedJourneyPolicyCode(item.code);
}
