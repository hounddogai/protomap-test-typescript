import { normalizeCsatDigestCode } from "../../csat/csat-draft/csat-digest-policy.js";
import { CsatDigest } from "../../csat/csat-draft/csat-digest.js";
import { ManualEscalationSchedule, newManualEscalationSchedule } from "./manual-escalation-schedule.js";

export function summarizeCsatDigestsForSchedule(items: CsatDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveManualEscalationSchedulesFromDigest(items: CsatDigest[]): ManualEscalationSchedule[] {
  const out: ManualEscalationSchedule[] = [];
  for (const item of items) {
    const derived = newManualEscalationSchedule(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreManualEscalationSchedule(item: ManualEscalationSchedule): string {
  return normalizeCsatDigestCode(item.code);
}
