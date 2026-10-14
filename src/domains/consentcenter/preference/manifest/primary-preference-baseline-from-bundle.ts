import { pendingOptOutAssignmentWeight } from "../../opt-out/out-assignment/pending-opt-out-assignment-policy.js";
import { RegionalOptOutBundle } from "../../opt-out/out-assignment/regional-opt-out-bundle.js";
import { PrimaryPreferenceBaseline, newPrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

export function summarizeRegionalOptOutBundlesForBaseline(items: RegionalOptOutBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePrimaryPreferenceBaselinesFromBundle(items: RegionalOptOutBundle[]): PrimaryPreferenceBaseline[] {
  const out: PrimaryPreferenceBaseline[] = [];
  for (const item of items) {
    const derived = newPrimaryPreferenceBaseline(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryPreferenceBaseline(item: PrimaryPreferenceBaseline): number {
  return pendingOptOutAssignmentWeight(9, true);
}
