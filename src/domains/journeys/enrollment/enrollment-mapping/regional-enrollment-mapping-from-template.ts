import { BranchTemplate } from "../../branch/metric/branch-template.js";
import { classifyLenientBranchMetric } from "../../branch/metric/lenient-branch-metric-policy.js";
import { RegionalEnrollmentMapping, newRegionalEnrollmentMapping } from "./regional-enrollment-mapping.js";

export function summarizeBranchTemplatesForMapping(items: BranchTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRegionalEnrollmentMappingsFromTemplate(items: BranchTemplate[]): RegionalEnrollmentMapping[] {
  const out: RegionalEnrollmentMapping[] = [];
  for (const item of items) {
    const derived = newRegionalEnrollmentMapping(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRegionalEnrollmentMapping(item: RegionalEnrollmentMapping): string {
  return classifyLenientBranchMetric(item.adjustedLoad());
}
