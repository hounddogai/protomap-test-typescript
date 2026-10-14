import { classifyRedemptionSlot } from "../../redemption/bundle/redemption-slot-policy.js";
import { RedemptionSlot } from "../../redemption/bundle/redemption-slot.js";
import { FallbackChallengeLedger, newFallbackChallengeLedger } from "./fallback-challenge-ledger.js";

export function summarizeRedemptionSlotsForLedger(items: RedemptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveFallbackChallengeLedgersFromSlot(items: RedemptionSlot[]): FallbackChallengeLedger[] {
  const out: FallbackChallengeLedger[] = [];
  for (const item of items) {
    const derived = newFallbackChallengeLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignFallbackChallengeLedger(item: FallbackChallengeLedger): string {
  return classifyRedemptionSlot(item.netTotal());
}
