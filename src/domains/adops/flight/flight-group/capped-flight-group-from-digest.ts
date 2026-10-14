import { FrequencyDigest } from "../../frequency/claim/frequency-digest.js";
import { strictFrequencyProfileBucket } from "../../frequency/claim/strict-frequency-profile-policy.js";
import { CappedFlightGroup, newCappedFlightGroup } from "./capped-flight-group.js";

export function summarizeFrequencyDigestsForGroup(items: FrequencyDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveCappedFlightGroupsFromDigest(items: FrequencyDigest[]): CappedFlightGroup[] {
  const out: CappedFlightGroup[] = [];
  for (const item of items) {
    const derived = newCappedFlightGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceCappedFlightGroup(item: CappedFlightGroup): string {
  return strictFrequencyProfileBucket(item.projectedVolume());
}
