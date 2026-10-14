import { classifyDefaultChallengeSlot } from "../../challenge/challenge-draft/default-challenge-slot-policy.js";
import { DefaultChallengeSlot } from "../../challenge/challenge-draft/default-challenge-slot.js";
import { RedemptionSegment, newRedemptionSegment } from "./redemption-segment.js";

export function summarizeDefaultChallengeSlotsForSegment(items: DefaultChallengeSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRedemptionSegmentsFromSlot(items: DefaultChallengeSlot[]): RedemptionSegment[] {
  const out: RedemptionSegment[] = [];
  for (const item of items) {
    const derived = newRedemptionSegment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRedemptionSegment(item: RedemptionSegment): string {
  return classifyDefaultChallengeSlot(item.adjustedExposure());
}
