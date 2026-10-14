import { cappedPacingTierBucket } from "../../pacing/tier/capped-pacing-tier-policy.js";
import { PacingReview } from "../../pacing/tier/pacing-review.js";
import { RollingBidRuleAudit, newRollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

export function summarizePacingReviewsForAudit(items: PacingReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRollingBidRuleAuditsFromReview(items: PacingReview[]): RollingBidRuleAudit[] {
  const out: RollingBidRuleAudit[] = [];
  for (const item of items) {
    const derived = newRollingBidRuleAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRollingBidRuleAudit(item: RollingBidRuleAudit): string {
  return cappedPacingTierBucket(item.adjustedVolume());
}
