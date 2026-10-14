import { frequencyTierBucket } from "../profile/frequency-tier-policy.js";
import { ScheduledFrequencyProfile } from "../profile/scheduled-frequency-profile.js";
import { FrequencyNotice, newFrequencyNotice } from "./frequency-notice.js";

export function summarizeScheduledFrequencyProfilesForNotice(items: ScheduledFrequencyProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFrequencyNoticesFromProfile(items: ScheduledFrequencyProfile[]): FrequencyNotice[] {
  const out: FrequencyNotice[] = [];
  for (const item of items) {
    const derived = newFrequencyNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeFrequencyNotice(item: FrequencyNotice): string {
  return frequencyTierBucket(item.netExposure());
}
