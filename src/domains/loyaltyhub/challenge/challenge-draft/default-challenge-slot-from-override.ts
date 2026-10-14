import { LegacyChallengeOverride } from "../primary-challenge-override/legacy-challenge-override.js";
import { classifyTieredChallengeAudit } from "../primary-challenge-override/tiered-challenge-audit-policy.js";
import { DefaultChallengeSlot, newDefaultChallengeSlot } from "./default-challenge-slot.js";

export function summarizeLegacyChallengeOverridesForSlot(items: LegacyChallengeOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDefaultChallengeSlotsFromOverride(items: LegacyChallengeOverride[]): DefaultChallengeSlot[] {
  const out: DefaultChallengeSlot[] = [];
  for (const item of items) {
    const derived = newDefaultChallengeSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultChallengeSlot(item: DefaultChallengeSlot): string {
  return classifyTieredChallengeAudit(item.effectiveExposure());
}
