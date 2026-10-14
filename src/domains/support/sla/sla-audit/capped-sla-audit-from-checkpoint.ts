import {
  normalizeRollingEscalationScheduleCode,
} from "../../escalation/checkpoint/rolling-escalation-schedule-policy.js";
import { WeightedEscalationCheckpoint } from "../../escalation/checkpoint/weighted-escalation-checkpoint.js";
import { CappedSlaAudit, newCappedSlaAudit } from "./capped-sla-audit.js";

export function summarizeWeightedEscalationCheckpointsForAudit(items: WeightedEscalationCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedSlaAuditsFromCheckpoint(items: WeightedEscalationCheckpoint[]): CappedSlaAudit[] {
  const out: CappedSlaAudit[] = [];
  for (const item of items) {
    const derived = newCappedSlaAudit(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeCappedSlaAudit(item: CappedSlaAudit): string {
  return normalizeRollingEscalationScheduleCode(item.code);
}
