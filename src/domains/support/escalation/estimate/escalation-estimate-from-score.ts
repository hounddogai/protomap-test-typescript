import { AdaptiveDeflectionScore } from "../../deflection/manifest/adaptive-deflection-score.js";
import { adaptiveDeflectionWindowWeight } from "../../deflection/manifest/adaptive-deflection-window-policy.js";
import { EscalationEstimate, newEscalationEstimate } from "./escalation-estimate.js";

export function summarizeAdaptiveDeflectionScoresForEstimate(items: AdaptiveDeflectionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveEscalationEstimatesFromScore(items: AdaptiveDeflectionScore[]): EscalationEstimate[] {
  const out: EscalationEstimate[] = [];
  for (const item of items) {
    const derived = newEscalationEstimate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchEscalationEstimate(item: EscalationEstimate): number {
  return adaptiveDeflectionWindowWeight(1, true);
}
