import { csatEntryWeight } from "../../csat/entry/csat-entry-policy.js";
import { CsatEntry } from "../../csat/entry/csat-entry.js";
import { SlaVariance, newSlaVariance } from "./sla-variance.js";

export function summarizeCsatEntriesForVariance(items: CsatEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveSlaVariancesFromEntry(items: CsatEntry[]): SlaVariance[] {
  const out: SlaVariance[] = [];
  for (const item of items) {
    const derived = newSlaVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchSlaVariance(item: SlaVariance): number {
  return csatEntryWeight(7, true);
}
