import { normalizeRollingFrequencyClaimCode } from "../claim/rolling-frequency-claim-policy.js";
import { RollingFrequencyClaim } from "../claim/rolling-frequency-claim.js";
import { CappedFrequencySlot, newCappedFrequencySlot } from "./capped-frequency-slot.js";

export function summarizeRollingFrequencyClaimsForSlot(items: RollingFrequencyClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCappedFrequencySlotsFromClaim(items: RollingFrequencyClaim[]): CappedFrequencySlot[] {
  const out: CappedFrequencySlot[] = [];
  for (const item of items) {
    const derived = newCappedFrequencySlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyCappedFrequencySlot(item: CappedFrequencySlot): string {
  return normalizeRollingFrequencyClaimCode(item.code);
}
