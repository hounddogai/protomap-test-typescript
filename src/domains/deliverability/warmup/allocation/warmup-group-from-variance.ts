import { ComplaintVariance } from "../../complaint/complaint-override/complaint-variance.js";
import {
  globalComplaintOverrideBucket,
} from "../../complaint/complaint-override/global-complaint-override-policy.js";
import { WarmupGroup, newWarmupGroup } from "./warmup-group.js";

export function summarizeComplaintVariancesForGroup(items: ComplaintVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveWarmupGroupsFromVariance(items: ComplaintVariance[]): WarmupGroup[] {
  const out: WarmupGroup[] = [];
  for (const item of items) {
    const derived = newWarmupGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchWarmupGroup(item: WarmupGroup): string {
  return globalComplaintOverrideBucket(item.projectedExposure());
}
