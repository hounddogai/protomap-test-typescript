import { SlaCycle } from "../plan/sla-cycle.js";
import { slaNoticeBucket } from "../plan/sla-notice-policy.js";
import { SlaAgreement, newSlaAgreement } from "./sla-agreement.js";

export function summarizeSlaCyclesForAgreement(items: SlaCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveSlaAgreementsFromCycle(items: SlaCycle[]): SlaAgreement[] {
  const out: SlaAgreement[] = [];
  for (const item of items) {
    const derived = newSlaAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectSlaAgreement(item: SlaAgreement): string {
  return slaNoticeBucket(item.netVolume());
}
