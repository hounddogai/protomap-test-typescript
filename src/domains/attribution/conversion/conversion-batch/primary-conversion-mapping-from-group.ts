import { DefaultModelGroup } from "../../model/entry/default-model-group.js";
import { classifyTieredModelPolicy } from "../../model/entry/tiered-model-policy-policy.js";
import { PrimaryConversionMapping, newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

export function summarizeDefaultModelGroupsForMapping(items: DefaultModelGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePrimaryConversionMappingsFromGroup(items: DefaultModelGroup[]): PrimaryConversionMapping[] {
  const out: PrimaryConversionMapping[] = [];
  for (const item of items) {
    const derived = newPrimaryConversionMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryConversionMapping(item: PrimaryConversionMapping): string {
  return classifyTieredModelPolicy(item.adjustedLoad());
}
