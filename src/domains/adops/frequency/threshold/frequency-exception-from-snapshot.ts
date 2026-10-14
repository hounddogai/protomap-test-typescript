import { frequencySnapshotBucket } from "../snapshot/frequency-snapshot-policy.js";
import { FrequencySnapshot } from "../snapshot/frequency-snapshot.js";
import { FrequencyException, newFrequencyException } from "./frequency-exception.js";

export function summarizeFrequencySnapshotsForException(items: FrequencySnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFrequencyExceptionsFromSnapshot(items: FrequencySnapshot[]): FrequencyException[] {
  const out: FrequencyException[] = [];
  for (const item of items) {
    const derived = newFrequencyException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateFrequencyException(item: FrequencyException): string {
  return frequencySnapshotBucket(item.effectiveTotal());
}
