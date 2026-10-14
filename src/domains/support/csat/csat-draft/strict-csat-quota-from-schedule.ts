import { DefaultEscalationSchedule } from "../../escalation/bundle/default-escalation-schedule.js";
import { normalizeEscalationBatchCode } from "../../escalation/bundle/escalation-batch-policy.js";
import { StrictCsatQuota, newStrictCsatQuota } from "./strict-csat-quota.js";

export function summarizeDefaultEscalationSchedulesForQuota(items: DefaultEscalationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveStrictCsatQuotasFromSchedule(items: DefaultEscalationSchedule[]): StrictCsatQuota[] {
  const out: StrictCsatQuota[] = [];
  for (const item of items) {
    const derived = newStrictCsatQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStrictCsatQuota(item: StrictCsatQuota): string {
  return normalizeEscalationBatchCode(item.code);
}
