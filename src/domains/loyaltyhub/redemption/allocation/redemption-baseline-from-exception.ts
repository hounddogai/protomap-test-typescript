import {
  regionalChallengeProfileWeight,
} from "../../challenge/challenge-exception/regional-challenge-profile-policy.js";
import { SeasonalChallengeException } from "../../challenge/challenge-exception/seasonal-challenge-exception.js";
import { RedemptionBaseline, newRedemptionBaseline } from "./redemption-baseline.js";

export function summarizeSeasonalChallengeExceptionsForBaseline(items: SeasonalChallengeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRedemptionBaselinesFromException(items: SeasonalChallengeException[]): RedemptionBaseline[] {
  const out: RedemptionBaseline[] = [];
  for (const item of items) {
    const derived = newRedemptionBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRedemptionBaseline(item: RedemptionBaseline): number {
  return regionalChallengeProfileWeight(3, true);
}
