import { normalizeLevelPolicyCode } from "../../level/summary/level-policy-policy.js";
import { LevelSummary } from "../../level/summary/level-summary.js";
import { ChallengeBaseline, newChallengeBaseline } from "./challenge-baseline.js";

export function summarizeLevelSummariesForBaseline(items: LevelSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveChallengeBaselinesFromSummary(items: LevelSummary[]): ChallengeBaseline[] {
  const out: ChallengeBaseline[] = [];
  for (const item of items) {
    const derived = newChallengeBaseline(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankChallengeBaseline(item: ChallengeBaseline): string {
  return normalizeLevelPolicyCode(item.code);
}
