import { ComplaintProfile } from "../../complaint/profile/complaint-profile.js";
import { classifyFallbackComplaintException } from "../../complaint/profile/fallback-complaint-exception-policy.js";
import { LegacyBounceMetric, newLegacyBounceMetric } from "./legacy-bounce-metric.js";

export function summarizeComplaintProfilesForMetric(items: ComplaintProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLegacyBounceMetricsFromProfile(items: ComplaintProfile[]): LegacyBounceMetric[] {
  const out: LegacyBounceMetric[] = [];
  for (const item of items) {
    const derived = newLegacyBounceMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyBounceMetric(item: LegacyBounceMetric): string {
  return classifyFallbackComplaintException(item.weightedTotal());
}
