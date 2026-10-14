import { normalizeChallengeRequestCode } from "../../challenge/draft/challenge-request-policy.js";
import { ChallengeRequest } from "../../challenge/draft/challenge-request.js";
import { BadgeManifest, newBadgeManifest } from "./badge-manifest.js";

export function summarizeChallengeRequestsForManifest(items: ChallengeRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBadgeManifestsFromRequest(items: ChallengeRequest[]): BadgeManifest[] {
  const out: BadgeManifest[] = [];
  for (const item of items) {
    const derived = newBadgeManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeBadgeManifest(item: BadgeManifest): string {
  return normalizeChallengeRequestCode(item.code);
}
