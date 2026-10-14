import { ChallengeDraft } from "../../challenge/draft/challenge-draft.js";
import { normalizeChallengeRequestCode } from "../../challenge/draft/challenge-request-policy.js";
import { LevelWindow, newLevelWindow } from "./level-window.js";

export function summarizeChallengeDraftsForWindow(items: ChallengeDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLevelWindowsFromDraft(items: ChallengeDraft[]): LevelWindow[] {
  const out: LevelWindow[] = [];
  for (const item of items) {
    const derived = newLevelWindow(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileLevelWindow(item: LevelWindow): string {
  return normalizeChallengeRequestCode(item.code);
}
