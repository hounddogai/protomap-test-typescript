import { normalizeCappedMentionBaselineCode } from "../../mention/request/capped-mention-baseline-policy.js";
import { ScheduledMentionMapping } from "../../mention/request/scheduled-mention-mapping.js";
import { RegionalApprovalNotice, newRegionalApprovalNotice } from "./regional-approval-notice.js";

export function summarizeScheduledMentionMappingsForNotice(items: ScheduledMentionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRegionalApprovalNoticesFromMapping(items: ScheduledMentionMapping[]): RegionalApprovalNotice[] {
  const out: RegionalApprovalNotice[] = [];
  for (const item of items) {
    const derived = newRegionalApprovalNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRegionalApprovalNotice(item: RegionalApprovalNotice): string {
  return normalizeCappedMentionBaselineCode(item.code);
}
