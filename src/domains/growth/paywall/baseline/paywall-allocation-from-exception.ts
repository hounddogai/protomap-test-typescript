import { CappedNudgeException } from "../../nudge/exception/capped-nudge-exception.js";
import { strictNudgeMappingBucket } from "../../nudge/exception/strict-nudge-mapping-policy.js";
import { PaywallAllocation, newPaywallAllocation } from "./paywall-allocation.js";

export function summarizeCappedNudgeExceptionsForAllocation(items: CappedNudgeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePaywallAllocationsFromException(items: CappedNudgeException[]): PaywallAllocation[] {
  const out: PaywallAllocation[] = [];
  for (const item of items) {
    const derived = newPaywallAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePaywallAllocation(item: PaywallAllocation): string {
  return strictNudgeMappingBucket(item.projectedExposure());
}
