import { DefaultFrequencySnapshot } from "../frequency-snapshot/default-frequency-snapshot.js";
import { classifyLenientFrequencyRecord } from "../frequency-snapshot/lenient-frequency-record-policy.js";
import { FrequencySegment, newFrequencySegment } from "./frequency-segment.js";

export function summarizeDefaultFrequencySnapshotsForSegment(items: DefaultFrequencySnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveFrequencySegmentsFromSnapshot(items: DefaultFrequencySnapshot[]): FrequencySegment[] {
  const out: FrequencySegment[] = [];
  for (const item of items) {
    const derived = newFrequencySegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceFrequencySegment(item: FrequencySegment): string {
  return classifyLenientFrequencyRecord(item.effectiveValue());
}
