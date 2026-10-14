import { challengeDigestBucket } from "../../challenge/manifest/challenge-digest-policy.js";
import { ChallengeManifest } from "../../challenge/manifest/challenge-manifest.js";
import { BadgeSlot, newBadgeSlot } from "./badge-slot.js";

export function summarizeChallengeManifestsForSlot(items: ChallengeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveBadgeSlotsFromManifest(items: ChallengeManifest[]): BadgeSlot[] {
  const out: BadgeSlot[] = [];
  for (const item of items) {
    const derived = newBadgeSlot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeBadgeSlot(item: BadgeSlot): string {
  return challengeDigestBucket(item.projectedVolume());
}
