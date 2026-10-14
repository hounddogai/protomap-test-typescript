import { EscalationAllocation } from "../notice/escalation-allocation.js";
import { classifyEscalationProfile } from "../notice/escalation-profile-policy.js";
import { LegacyEscalationNotice, newLegacyEscalationNotice } from "./legacy-escalation-notice.js";

export function summarizeEscalationAllocationsForNotice(items: EscalationAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyEscalationNoticesFromAllocation(items: EscalationAllocation[]): LegacyEscalationNotice[] {
  const out: LegacyEscalationNotice[] = [];
  for (const item of items) {
    const derived = newLegacyEscalationNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLegacyEscalationNotice(item: LegacyEscalationNotice): string {
  return classifyEscalationProfile(item.netLoad());
}
