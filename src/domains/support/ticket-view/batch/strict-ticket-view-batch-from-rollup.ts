import {
  normalizeScheduledDeflectionRollupCode,
} from "../../deflection/rollup/scheduled-deflection-rollup-policy.js";
import { ScheduledDeflectionRollup } from "../../deflection/rollup/scheduled-deflection-rollup.js";
import { StrictTicketViewBatch, newStrictTicketViewBatch } from "./strict-ticket-view-batch.js";

export function summarizeScheduledDeflectionRollupsForBatch(items: ScheduledDeflectionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveStrictTicketViewBatchesFromRollup(items: ScheduledDeflectionRollup[]): StrictTicketViewBatch[] {
  const out: StrictTicketViewBatch[] = [];
  for (const item of items) {
    const derived = newStrictTicketViewBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveStrictTicketViewBatch(item: StrictTicketViewBatch): string {
  return normalizeScheduledDeflectionRollupCode(item.code);
}
