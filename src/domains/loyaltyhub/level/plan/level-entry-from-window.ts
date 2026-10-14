import { challengeRuleBucket } from "../../challenge/variance/challenge-rule-policy.js";
import { ChallengeWindow } from "../../challenge/variance/challenge-window.js";
import { LevelEntry, newLevelEntry } from "./level-entry.js";

export function summarizeChallengeWindowsForEntry(items: ChallengeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveLevelEntriesFromWindow(items: ChallengeWindow[]): LevelEntry[] {
  const out: LevelEntry[] = [];
  for (const item of items) {
    const derived = newLevelEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLevelEntry(item: LevelEntry): string {
  return challengeRuleBucket(item.weightedExposure());
}
