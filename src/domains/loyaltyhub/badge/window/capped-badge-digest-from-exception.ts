import {
  strictRedemptionExceptionBucket,
} from "../../redemption/redemption-override/strict-redemption-exception-policy.js";
import { StrictRedemptionException } from "../../redemption/redemption-override/strict-redemption-exception.js";
import { CappedBadgeDigest, newCappedBadgeDigest } from "./capped-badge-digest.js";

export function summarizeStrictRedemptionExceptionsForDigest(items: StrictRedemptionException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCappedBadgeDigestsFromException(items: StrictRedemptionException[]): CappedBadgeDigest[] {
  const out: CappedBadgeDigest[] = [];
  for (const item of items) {
    const derived = newCappedBadgeDigest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceCappedBadgeDigest(item: CappedBadgeDigest): string {
  return strictRedemptionExceptionBucket(item.netExposure());
}
