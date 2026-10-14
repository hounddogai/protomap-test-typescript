import { normalizeInviteCheckpointCode } from "../../invite/invite-rule/invite-checkpoint-policy.js";
import { LegacyInviteRule } from "../../invite/invite-rule/legacy-invite-rule.js";
import { AdaptiveFraudCheckScore, newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

export function summarizeLegacyInviteRulesForScore(items: LegacyInviteRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveFraudCheckScoresFromRule(items: LegacyInviteRule[]): AdaptiveFraudCheckScore[] {
  const out: AdaptiveFraudCheckScore[] = [];
  for (const item of items) {
    const derived = newAdaptiveFraudCheckScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveFraudCheckScore(item: AdaptiveFraudCheckScore): string {
  return normalizeInviteCheckpointCode(item.code);
}
