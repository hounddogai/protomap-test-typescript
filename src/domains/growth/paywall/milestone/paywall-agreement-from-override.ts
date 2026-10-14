import { NudgeOverride } from "../../nudge/score/nudge-override.js";
import { nudgeScoreWeight } from "../../nudge/score/nudge-score-policy.js";
import { PaywallAgreement, newPaywallAgreement } from "./paywall-agreement.js";

export function summarizeNudgeOverridesForAgreement(items: NudgeOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePaywallAgreementsFromOverride(items: NudgeOverride[]): PaywallAgreement[] {
  const out: PaywallAgreement[] = [];
  for (const item of items) {
    const derived = newPaywallAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planPaywallAgreement(item: PaywallAgreement): number {
  return nudgeScoreWeight(3, true);
}
