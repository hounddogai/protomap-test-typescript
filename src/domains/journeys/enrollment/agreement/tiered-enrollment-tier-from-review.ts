import { defaultBranchLedgerBucket } from "../../branch/ledger/default-branch-ledger-policy.js";
import { StrictBranchReview } from "../../branch/ledger/strict-branch-review.js";
import { TieredEnrollmentTier, newTieredEnrollmentTier } from "./tiered-enrollment-tier.js";

export function summarizeStrictBranchReviewsForTier(items: StrictBranchReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveTieredEnrollmentTiersFromReview(items: StrictBranchReview[]): TieredEnrollmentTier[] {
  const out: TieredEnrollmentTier[] = [];
  for (const item of items) {
    const derived = newTieredEnrollmentTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyTieredEnrollmentTierExtra(item: TieredEnrollmentTier): string {
  return defaultBranchLedgerBucket(item.netTotal());
}
