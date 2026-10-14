import {
  classifyPrimaryRedemptionException,
} from "../../redemption/redemption-window/primary-redemption-exception-policy.js";
import { PrimaryRedemptionException } from "../../redemption/redemption-window/primary-redemption-exception.js";
import { GlobalLevelAdjustment, newGlobalLevelAdjustment } from "./global-level-adjustment.js";

export function summarizePrimaryRedemptionExceptionsForAdjustment(items: PrimaryRedemptionException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveGlobalLevelAdjustmentsFromException(items: PrimaryRedemptionException[]): GlobalLevelAdjustment[] {
  const out: GlobalLevelAdjustment[] = [];
  for (const item of items) {
    const derived = newGlobalLevelAdjustment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchGlobalLevelAdjustment(item: GlobalLevelAdjustment): string {
  return classifyPrimaryRedemptionException(item.projectedTotal());
}
