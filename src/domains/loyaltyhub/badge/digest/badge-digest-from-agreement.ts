import { RedemptionAgreement } from "../../redemption/batch/redemption-agreement.js";
import { normalizeRedemptionBatchCode } from "../../redemption/batch/redemption-batch-policy.js";
import { BadgeDigest, newBadgeDigest } from "./badge-digest.js";

export function summarizeRedemptionAgreementsForDigest(items: RedemptionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBadgeDigestsFromAgreement(items: RedemptionAgreement[]): BadgeDigest[] {
  const out: BadgeDigest[] = [];
  for (const item of items) {
    const derived = newBadgeDigest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreBadgeDigest(item: BadgeDigest): string {
  return normalizeRedemptionBatchCode(item.code);
}
