import {
  normalizeDefaultSuppressionEstimateCode,
} from "../../suppression/suppression-template/default-suppression-estimate-policy.js";
import { LegacySuppressionClaim } from "../../suppression/suppression-template/legacy-suppression-claim.js";
import { RegionalDoubleOptInMetric, newRegionalDoubleOptInMetric } from "./regional-double-opt-in-metric.js";

export function summarizeLegacySuppressionClaimsForMetric(items: LegacySuppressionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalDoubleOptInMetricsFromClaim(items: LegacySuppressionClaim[]): RegionalDoubleOptInMetric[] {
  const out: RegionalDoubleOptInMetric[] = [];
  for (const item of items) {
    const derived = newRegionalDoubleOptInMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveRegionalDoubleOptInMetric(item: RegionalDoubleOptInMetric): string {
  return normalizeDefaultSuppressionEstimateCode(item.code);
}
