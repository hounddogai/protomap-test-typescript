import { classifyStrictSubscriptionBundle } from "../../subscription/group/strict-subscription-bundle-policy.js";
import { StrictSubscriptionBundle } from "../../subscription/group/strict-subscription-bundle.js";
import { CappedProofCycle, newCappedProofCycle } from "./capped-proof-cycle.js";

export function summarizeStrictSubscriptionBundlesForCycle(items: StrictSubscriptionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveCappedProofCyclesFromBundle(items: StrictSubscriptionBundle[]): CappedProofCycle[] {
  const out: CappedProofCycle[] = [];
  for (const item of items) {
    const derived = newCappedProofCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitCappedProofCycle(item: CappedProofCycle): string {
  return classifyStrictSubscriptionBundle(item.adjustedLoad());
}
