import { complaintOverrideWeight } from "../../complaint/override-item/complaint-override-policy.js";
import { ComplaintOverride } from "../../complaint/override-item/complaint-override.js";
import { BounceOverride, newBounceOverride } from "./bounce-override.js";

export function summarizeComplaintOverridesForOverride(items: ComplaintOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBounceOverridesFromOverride(items: ComplaintOverride[]): BounceOverride[] {
  const out: BounceOverride[] = [];
  for (const item of items) {
    const derived = newBounceOverride(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignBounceOverride(item: BounceOverride): number {
  return complaintOverrideWeight(8, true);
}
