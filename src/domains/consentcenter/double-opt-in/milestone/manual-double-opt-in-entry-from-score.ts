import { DefaultDoubleOptInScore } from "../notice/default-double-opt-in-score.js";
import { doubleOptInOverrideBucket } from "../notice/double-opt-in-override-policy.js";
import { ManualDoubleOptInEntry, newManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

export function summarizeDefaultDoubleOptInScoresForEntry(items: DefaultDoubleOptInScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualDoubleOptInEntriesFromScore(items: DefaultDoubleOptInScore[]): ManualDoubleOptInEntry[] {
  const out: ManualDoubleOptInEntry[] = [];
  for (const item of items) {
    const derived = newManualDoubleOptInEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveManualDoubleOptInEntry(item: ManualDoubleOptInEntry): string {
  return doubleOptInOverrideBucket(item.weightedLoad());
}
