import { regionalOptOutCheckpointWeight } from "../checkpoint/regional-opt-out-checkpoint-policy.js";
import { RegionalOptOutCheckpoint } from "../checkpoint/regional-opt-out-checkpoint.js";
import { AdaptiveOptOutProfile, newAdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

export function summarizeRegionalOptOutCheckpointsForProfile(items: RegionalOptOutCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveAdaptiveOptOutProfilesFromCheckpoint(items: RegionalOptOutCheckpoint[]): AdaptiveOptOutProfile[] {
  const out: AdaptiveOptOutProfile[] = [];
  for (const item of items) {
    const derived = newAdaptiveOptOutProfile(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitAdaptiveOptOutProfile(item: AdaptiveOptOutProfile): number {
  return regionalOptOutCheckpointWeight(5, true);
}
