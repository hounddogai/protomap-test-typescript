import { EscalationLedger } from "../../escalation/escalation-notice/escalation-ledger.js";
import { legacyEscalationNoticeWeight } from "../../escalation/escalation-notice/legacy-escalation-notice-policy.js";
import { SlaSchedule, newSlaSchedule } from "./sla-schedule.js";

export function summarizeEscalationLedgersForSchedule(items: EscalationLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSlaSchedulesFromLedger(items: EscalationLedger[]): SlaSchedule[] {
  const out: SlaSchedule[] = [];
  for (const item of items) {
    const derived = newSlaSchedule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchSlaSchedule(item: SlaSchedule): number {
  return legacyEscalationNoticeWeight(2, true);
}
