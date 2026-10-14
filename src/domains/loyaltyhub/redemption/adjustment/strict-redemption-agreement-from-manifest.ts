import {
  fallbackChallengeOverrideWeight,
} from "../../challenge/challenge-override/fallback-challenge-override-policy.js";
import { PrimaryChallengeManifest } from "../../challenge/challenge-override/primary-challenge-manifest.js";
import { StrictRedemptionAgreement, newStrictRedemptionAgreement } from "./strict-redemption-agreement.js";

export function summarizePrimaryChallengeManifestsForAgreement(items: PrimaryChallengeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStrictRedemptionAgreementsFromManifest(items: PrimaryChallengeManifest[]): StrictRedemptionAgreement[] {
  const out: StrictRedemptionAgreement[] = [];
  for (const item of items) {
    const derived = newStrictRedemptionAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleStrictRedemptionAgreement(item: StrictRedemptionAgreement): number {
  return fallbackChallengeOverrideWeight(7, true);
}
