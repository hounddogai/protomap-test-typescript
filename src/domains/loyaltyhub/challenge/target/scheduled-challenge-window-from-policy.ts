import { fallbackLevelPolicyWeight } from "../../level/level-plan/fallback-level-policy-policy.js";
import { FallbackLevelPolicy } from "../../level/level-plan/fallback-level-policy.js";
import { ScheduledChallengeWindow, newScheduledChallengeWindow } from "./scheduled-challenge-window.js";

export function summarizeFallbackLevelPoliciesForWindow(items: FallbackLevelPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveScheduledChallengeWindowsFromPolicy(items: FallbackLevelPolicy[]): ScheduledChallengeWindow[] {
  const out: ScheduledChallengeWindow[] = [];
  for (const item of items) {
    const derived = newScheduledChallengeWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateScheduledChallengeWindow(item: ScheduledChallengeWindow): number {
  return fallbackLevelPolicyWeight(7, true);
}
