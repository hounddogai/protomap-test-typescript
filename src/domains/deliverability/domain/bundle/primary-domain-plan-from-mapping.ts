import { AdaptiveComplaintMapping } from "../../complaint/complaint-mapping/adaptive-complaint-mapping.js";
import {
  classifyGlobalComplaintVariance,
} from "../../complaint/complaint-mapping/global-complaint-variance-policy.js";
import { PrimaryDomainPlan, newPrimaryDomainPlan } from "./primary-domain-plan.js";

export function summarizeAdaptiveComplaintMappingsForPlan(items: AdaptiveComplaintMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function derivePrimaryDomainPlansFromMapping(items: AdaptiveComplaintMapping[]): PrimaryDomainPlan[] {
  const out: PrimaryDomainPlan[] = [];
  for (const item of items) {
    const derived = newPrimaryDomainPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePrimaryDomainPlan(item: PrimaryDomainPlan): string {
  return classifyGlobalComplaintVariance(item.measuredValue());
}
