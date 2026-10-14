import { defaultSenderRollupBucket } from "../snapshot/default-sender-rollup-policy.js";
import { RegionalSenderSnapshot } from "../snapshot/regional-sender-snapshot.js";
import { WeightedSenderException, newWeightedSenderException } from "./weighted-sender-exception.js";

export function summarizeRegionalSenderSnapshotsForException(items: RegionalSenderSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedSenderExceptionsFromSnapshot(items: RegionalSenderSnapshot[]): WeightedSenderException[] {
  const out: WeightedSenderException[] = [];
  for (const item of items) {
    const derived = newWeightedSenderException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeWeightedSenderException(item: WeightedSenderException): string {
  return defaultSenderRollupBucket(item.weightedExposure());
}
