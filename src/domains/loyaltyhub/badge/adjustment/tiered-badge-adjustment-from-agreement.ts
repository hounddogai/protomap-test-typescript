import { CappedRedemptionAgreement } from "../../redemption/redemption-group/capped-redemption-agreement.js";
import {
  classifyRegionalRedemptionGroup,
} from "../../redemption/redemption-group/regional-redemption-group-policy.js";
import { TieredBadgeAdjustment, newTieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

export function summarizeCappedRedemptionAgreementsForAdjustment(items: CappedRedemptionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveTieredBadgeAdjustmentsFromAgreement(items: CappedRedemptionAgreement[]): TieredBadgeAdjustment[] {
  const out: TieredBadgeAdjustment[] = [];
  for (const item of items) {
    const derived = newTieredBadgeAdjustment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignTieredBadgeAdjustment(item: TieredBadgeAdjustment): string {
  return classifyRegionalRedemptionGroup(item.projectedValue());
}
