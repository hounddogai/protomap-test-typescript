import { TouchpointSummary } from "../../touchpoint/preference/touchpoint-summary.js";
import { touchpointTargetWeight } from "../../touchpoint/preference/touchpoint-target-policy.js";
import { PathPolicy, newPathPolicy } from "./path-policy.js";

export function summarizeTouchpointSummariesForPolicy(items: TouchpointSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePathPoliciesFromSummary(items: TouchpointSummary[]): PathPolicy[] {
  const out: PathPolicy[] = [];
  for (const item of items) {
    const derived = newPathPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePathPolicy(item: PathPolicy): number {
  return touchpointTargetWeight(8, true);
}
