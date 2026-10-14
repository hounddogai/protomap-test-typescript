import { defaultInviteCycleBucket } from "../../invite/cycle/default-invite-cycle-policy.js";
import { DefaultInviteCycle } from "../../invite/cycle/default-invite-cycle.js";
import { LeaderboardCycle } from "../../leaderboard/template/leaderboard-cycle.js";
import {
  classifyRollingLeaderboardAssignment,
} from "../../leaderboard/template/rolling-leaderboard-assignment-policy.js";
import { CappedRewardRuleNotice, newCappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

export function summarizeLeaderboardCyclesForNotice(items: LeaderboardCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveCappedRewardRuleNoticesFromCycle(items: LeaderboardCycle[]): CappedRewardRuleNotice[] {
  const out: CappedRewardRuleNotice[] = [];
  for (const item of items) {
    const derived = newCappedRewardRuleNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedRewardRuleNotice(item: CappedRewardRuleNotice): string {
  return classifyRollingLeaderboardAssignment(item.adjustedValue());
}

export function summarizeDefaultInviteCyclesForNotice(items: DefaultInviteCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCappedRewardRuleNoticesFromCycleExtra(items: DefaultInviteCycle[]): CappedRewardRuleNotice[] {
  const out: CappedRewardRuleNotice[] = [];
  for (const item of items) {
    const derived = newCappedRewardRuleNotice(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveCappedRewardRuleNotice(item: CappedRewardRuleNotice): string {
  return defaultInviteCycleBucket(item.adjustedValue());
}
