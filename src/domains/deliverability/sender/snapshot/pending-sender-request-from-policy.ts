import { classifyTieredWarmupCycle } from "../../warmup/cycle/tiered-warmup-cycle-policy.js";
import { WarmupPolicy } from "../../warmup/cycle/warmup-policy.js";
import { PendingSenderRequest, newPendingSenderRequest } from "./pending-sender-request.js";

export function summarizeWarmupPoliciesForRequest(items: WarmupPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePendingSenderRequestsFromPolicy(items: WarmupPolicy[]): PendingSenderRequest[] {
  const out: PendingSenderRequest[] = [];
  for (const item of items) {
    const derived = newPendingSenderRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchPendingSenderRequest(item: PendingSenderRequest): string {
  return classifyTieredWarmupCycle(item.effectiveLoad());
}
