import { CappedRedemptionAgreement } from "../../redemption/redemption-group/capped-redemption-agreement.js";
import {
  normalizeRegionalRedemptionGroupCode,
} from "../../redemption/redemption-group/regional-redemption-group-policy.js";
import { StreakSlot, newStreakSlot } from "./streak-slot.js";

export function summarizeCappedRedemptionAgreementsForSlot(items: CappedRedemptionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveStreakSlotsFromAgreement(items: CappedRedemptionAgreement[]): StreakSlot[] {
  const out: StreakSlot[] = [];
  for (const item of items) {
    const derived = newStreakSlot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectStreakSlot(item: StreakSlot): string {
  return normalizeRegionalRedemptionGroupCode(item.code);
}
