import { pathMetricWeight } from "../../path/path-milestone/path-metric-policy.js";
import { StrictPathEntry } from "../../path/path-milestone/strict-path-entry.js";
import { TieredWindowException, newTieredWindowException } from "./tiered-window-exception.js";

export function summarizeStrictPathEntriesForException(items: StrictPathEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveTieredWindowExceptionsFromEntry(items: StrictPathEntry[]): TieredWindowException[] {
  const out: TieredWindowException[] = [];
  for (const item of items) {
    const derived = newTieredWindowException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceTieredWindowException(item: TieredWindowException): number {
  return pathMetricWeight(2, true);
}
