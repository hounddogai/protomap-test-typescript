import { ConversionGroup } from "../../conversion/group/conversion-group.js";
import { conversionSummaryBucket } from "../../conversion/group/conversion-summary-policy.js";
import { LegacyWindowSummary, newLegacyWindowSummary } from "./legacy-window-summary.js";

export function summarizeConversionGroupsForSummary(items: ConversionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveLegacyWindowSummariesFromGroup(items: ConversionGroup[]): LegacyWindowSummary[] {
  const out: LegacyWindowSummary[] = [];
  for (const item of items) {
    const derived = newLegacyWindowSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveLegacyWindowSummary(item: LegacyWindowSummary): string {
  return conversionSummaryBucket(item.effectiveExposure());
}
