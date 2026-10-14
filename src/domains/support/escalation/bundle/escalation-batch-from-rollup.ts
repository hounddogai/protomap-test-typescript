import { SeasonalEscalationRollup } from "../adjustment/seasonal-escalation-rollup.js";
import { normalizeSeasonalEscalationScheduleCode } from "../adjustment/seasonal-escalation-schedule-policy.js";
import { EscalationBatch, newEscalationBatch } from "./escalation-batch.js";

export function summarizeSeasonalEscalationRollupsForBatch(items: SeasonalEscalationRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveEscalationBatchesFromRollup(items: SeasonalEscalationRollup[]): EscalationBatch[] {
  const out: EscalationBatch[] = [];
  for (const item of items) {
    const derived = newEscalationBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeEscalationBatch(item: EscalationBatch): string {
  return normalizeSeasonalEscalationScheduleCode(item.code);
}
