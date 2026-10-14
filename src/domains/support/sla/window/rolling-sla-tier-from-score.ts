import { normalizeMacroScoreCode } from "../../macro/score/macro-score-policy.js";
import { MacroScore } from "../../macro/score/macro-score.js";
import { RollingSlaTier, newRollingSlaTier } from "./rolling-sla-tier.js";

export function summarizeMacroScoresForTier(items: MacroScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingSlaTiersFromScore(items: MacroScore[]): RollingSlaTier[] {
  const out: RollingSlaTier[] = [];
  for (const item of items) {
    const derived = newRollingSlaTier(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeRollingSlaTier(item: RollingSlaTier): string {
  return normalizeMacroScoreCode(item.code);
}
