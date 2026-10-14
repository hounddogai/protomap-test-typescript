import {
  cappedTouchpointSummaryBucket,
} from "../../touchpoint/touchpoint-reservation/capped-touchpoint-summary-policy.js";
import { CappedTouchpointSummary } from "../../touchpoint/touchpoint-reservation/capped-touchpoint-summary.js";
import { ConversionGroup, newConversionGroup } from "./conversion-group.js";

export function summarizeCappedTouchpointSummariesForGroup(items: CappedTouchpointSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveConversionGroupsFromSummary(items: CappedTouchpointSummary[]): ConversionGroup[] {
  const out: ConversionGroup[] = [];
  for (const item of items) {
    const derived = newConversionGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateConversionGroup(item: ConversionGroup): string {
  return cappedTouchpointSummaryBucket(item.netVolume());
}
