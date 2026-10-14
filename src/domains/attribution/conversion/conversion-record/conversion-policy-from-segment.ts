import { classifyRegionalTouchpointAudit } from "../../touchpoint/audit/regional-touchpoint-audit-policy.js";
import { SeasonalTouchpointSegment } from "../../touchpoint/audit/seasonal-touchpoint-segment.js";
import { ConversionPolicy, newConversionPolicy } from "./conversion-policy.js";

export function summarizeSeasonalTouchpointSegmentsForPolicy(items: SeasonalTouchpointSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveConversionPoliciesFromSegment(items: SeasonalTouchpointSegment[]): ConversionPolicy[] {
  const out: ConversionPolicy[] = [];
  for (const item of items) {
    const derived = newConversionPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeConversionPolicy(item: ConversionPolicy): string {
  return classifyRegionalTouchpointAudit(item.measuredValue());
}
