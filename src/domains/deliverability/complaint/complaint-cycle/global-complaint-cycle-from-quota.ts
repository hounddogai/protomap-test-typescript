import { WarmupQuota } from "../../warmup/policy/warmup-quota.js";
import { warmupRollupBucket } from "../../warmup/policy/warmup-rollup-policy.js";
import { GlobalComplaintCycle, newGlobalComplaintCycle } from "./global-complaint-cycle.js";

export function summarizeWarmupQuotasForCycle(items: WarmupQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalComplaintCyclesFromQuota(items: WarmupQuota[]): GlobalComplaintCycle[] {
  const out: GlobalComplaintCycle[] = [];
  for (const item of items) {
    const derived = newGlobalComplaintCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalComplaintCycle(item: GlobalComplaintCycle): string {
  return warmupRollupBucket(item.netExposure());
}
