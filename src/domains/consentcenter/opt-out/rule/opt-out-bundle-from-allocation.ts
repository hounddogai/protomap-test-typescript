import { classifyProofSlot } from "../../proof/proof-allocation/proof-slot-policy.js";
import { RollingProofAllocation } from "../../proof/proof-allocation/rolling-proof-allocation.js";
import { OptOutBundle, newOptOutBundle } from "./opt-out-bundle.js";

export function summarizeRollingProofAllocationsForBundle(items: RollingProofAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveOptOutBundlesFromAllocation(items: RollingProofAllocation[]): OptOutBundle[] {
  const out: OptOutBundle[] = [];
  for (const item of items) {
    const derived = newOptOutBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchOptOutBundle(item: OptOutBundle): string {
  return classifyProofSlot(item.netExposure());
}
