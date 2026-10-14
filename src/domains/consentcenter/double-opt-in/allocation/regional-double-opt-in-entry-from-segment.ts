import { doubleOptInReservationWeight } from "../reservation/double-opt-in-reservation-policy.js";
import { DoubleOptInSegment } from "../reservation/double-opt-in-segment.js";
import { RegionalDoubleOptInEntry, newRegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

export function summarizeDoubleOptInSegmentsForEntry(items: DoubleOptInSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRegionalDoubleOptInEntriesFromSegment(items: DoubleOptInSegment[]): RegionalDoubleOptInEntry[] {
  const out: RegionalDoubleOptInEntry[] = [];
  for (const item of items) {
    const derived = newRegionalDoubleOptInEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRegionalDoubleOptInEntry(item: RegionalDoubleOptInEntry): number {
  return doubleOptInReservationWeight(4, true);
}
