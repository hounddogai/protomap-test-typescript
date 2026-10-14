import { normalizeRedemptionExceptionCode } from "../../redemption/exception/redemption-exception-policy.js";
import { RedemptionException } from "../../redemption/exception/redemption-exception.js";
import { BadgeSlot, newBadgeSlot } from "./badge-slot.js";

export function summarizeRedemptionExceptionsForSlot(items: RedemptionException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveBadgeSlotsFromException(items: RedemptionException[]): BadgeSlot[] {
  const out: BadgeSlot[] = [];
  for (const item of items) {
    const derived = newBadgeSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchBadgeSlot(item: BadgeSlot): string {
  return normalizeRedemptionExceptionCode(item.code);
}
