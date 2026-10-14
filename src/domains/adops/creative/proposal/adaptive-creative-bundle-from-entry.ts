import { normalizeRegionalCreativeEntryCode } from "../override-item/regional-creative-entry-policy.js";
import { RegionalCreativeEntry } from "../override-item/regional-creative-entry.js";
import { AdaptiveCreativeBundle, newAdaptiveCreativeBundle } from "./adaptive-creative-bundle.js";

export function summarizeRegionalCreativeEntriesForBundle(items: RegionalCreativeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveAdaptiveCreativeBundlesFromEntry(items: RegionalCreativeEntry[]): AdaptiveCreativeBundle[] {
  const out: AdaptiveCreativeBundle[] = [];
  for (const item of items) {
    const derived = newAdaptiveCreativeBundle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignAdaptiveCreativeBundle(item: AdaptiveCreativeBundle): string {
  return normalizeRegionalCreativeEntryCode(item.code);
}
