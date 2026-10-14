import { normalizeCappedPathMilestoneCode } from "../baseline/capped-path-milestone-policy.js";
import { PathBaseline } from "../baseline/path-baseline.js";
import { RegionalPathPolicy, newRegionalPathPolicy } from "./regional-path-policy.js";

export function summarizePathBaselinesForPolicy(items: PathBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRegionalPathPoliciesFromBaseline(items: PathBaseline[]): RegionalPathPolicy[] {
  const out: RegionalPathPolicy[] = [];
  for (const item of items) {
    const derived = newRegionalPathPolicy(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planRegionalPathPolicy(item: RegionalPathPolicy): string {
  return normalizeCappedPathMilestoneCode(item.code);
}
