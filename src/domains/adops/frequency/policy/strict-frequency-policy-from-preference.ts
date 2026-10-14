import { creativeCheckpointBucket } from "../../creative/preference/creative-checkpoint-policy.js";
import { ScheduledCreativePreference } from "../../creative/preference/scheduled-creative-preference.js";
import { StrictFrequencyPolicy, newStrictFrequencyPolicy } from "./strict-frequency-policy.js";

export function summarizeScheduledCreativePreferencesForPolicy(items: ScheduledCreativePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStrictFrequencyPoliciesFromPreference(items: ScheduledCreativePreference[]): StrictFrequencyPolicy[] {
  const out: StrictFrequencyPolicy[] = [];
  for (const item of items) {
    const derived = newStrictFrequencyPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectStrictFrequencyPolicy(item: StrictFrequencyPolicy): string {
  return creativeCheckpointBucket(item.netVolume());
}
