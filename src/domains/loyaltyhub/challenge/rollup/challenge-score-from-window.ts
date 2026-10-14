import { normalizeBadgeExceptionCode } from "../../badge/exception/badge-exception-policy.js";
import { BadgeWindow } from "../../badge/exception/badge-window.js";
import { ChallengeScore, newChallengeScore } from "./challenge-score.js";

export function summarizeBadgeWindowsForScore(items: BadgeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveChallengeScoresFromWindow(items: BadgeWindow[]): ChallengeScore[] {
  const out: ChallengeScore[] = [];
  for (const item of items) {
    const derived = newChallengeScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveChallengeScore(item: ChallengeScore): string {
  return normalizeBadgeExceptionCode(item.code);
}
