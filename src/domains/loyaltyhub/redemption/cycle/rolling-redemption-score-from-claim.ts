import { classifyChallengeClaim } from "../../challenge/quota/challenge-claim-policy.js";
import { ChallengeClaim } from "../../challenge/quota/challenge-claim.js";
import { RollingRedemptionScore, newRollingRedemptionScore } from "./rolling-redemption-score.js";

export function summarizeChallengeClaimsForScore(items: ChallengeClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRollingRedemptionScoresFromClaim(items: ChallengeClaim[]): RollingRedemptionScore[] {
  const out: RollingRedemptionScore[] = [];
  for (const item of items) {
    const derived = newRollingRedemptionScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRollingRedemptionScore(item: RollingRedemptionScore): string {
  return classifyChallengeClaim(item.weightedExposure());
}
