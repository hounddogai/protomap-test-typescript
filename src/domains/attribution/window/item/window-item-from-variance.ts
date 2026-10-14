import { globalPathMetricWeight } from "../../path/variance/global-path-metric-policy.js";
import { PathVariance } from "../../path/variance/path-variance.js";
import { WindowItem, newWindowItem } from "./window-item.js";

export function summarizePathVariancesForItem(items: PathVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWindowItemsFromVariance(items: PathVariance[]): WindowItem[] {
  const out: WindowItem[] = [];
  for (const item of items) {
    const derived = newWindowItem(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWindowItem(item: WindowItem): number {
  return globalPathMetricWeight(9, true);
}
