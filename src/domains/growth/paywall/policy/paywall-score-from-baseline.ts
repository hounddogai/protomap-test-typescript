import { ManualNudgeBaseline } from "../../nudge/rollup/manual-nudge-baseline.js";
import { nudgeRollupWeight } from "../../nudge/rollup/nudge-rollup-policy.js";
import { PaywallScore, newPaywallScore } from "./paywall-score.js";

export function summarizeManualNudgeBaselinesForScore(items: ManualNudgeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePaywallScoresFromBaseline(items: ManualNudgeBaseline[]): PaywallScore[] {
  const out: PaywallScore[] = [];
  for (const item of items) {
    const derived = newPaywallScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPaywallScore(item: PaywallScore): number {
  return nudgeRollupWeight(4, true);
}
