import { ChallengeEntry } from "../../challenge/entry/challenge-entry.js";
import { regionalChallengeAgreementWeight } from "../../challenge/entry/regional-challenge-agreement-policy.js";
import { LegacyRewardSlot, newLegacyRewardSlot } from "./legacy-reward-slot.js";

export function summarizeChallengeEntriesForSlot(items: ChallengeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLegacyRewardSlotsFromEntry(items: ChallengeEntry[]): LegacyRewardSlot[] {
  const out: LegacyRewardSlot[] = [];
  for (const item of items) {
    const derived = newLegacyRewardSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLegacyRewardSlot(item: LegacyRewardSlot): number {
  return regionalChallengeAgreementWeight(2, true);
}
