import { classifyPendingLevelMilestone } from "../../level/milestone/pending-level-milestone-policy.js";
import { TieredLevelReservation } from "../../level/milestone/tiered-level-reservation.js";
import { RollingRedemptionVariance, newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

export function summarizeTieredLevelReservationsForVariance(items: TieredLevelReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRollingRedemptionVariancesFromReservation(items: TieredLevelReservation[]): RollingRedemptionVariance[] {
  const out: RollingRedemptionVariance[] = [];
  for (const item of items) {
    const derived = newRollingRedemptionVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRollingRedemptionVariance(item: RollingRedemptionVariance): string {
  return classifyPendingLevelMilestone(item.measuredValue());
}
