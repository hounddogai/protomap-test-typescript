import { DeflectionAssignment } from "../../deflection/assignment/deflection-assignment.js";
import { normalizeDeflectionNoticeCode } from "../../deflection/assignment/deflection-notice-policy.js";
import { TicketViewQuota, newTicketViewQuota } from "./ticket-view-quota.js";

export function summarizeDeflectionAssignmentsForQuota(items: DeflectionAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveTicketViewQuotasFromAssignment(items: DeflectionAssignment[]): TicketViewQuota[] {
  const out: TicketViewQuota[] = [];
  for (const item of items) {
    const derived = newTicketViewQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTicketViewQuota(item: TicketViewQuota): string {
  return normalizeDeflectionNoticeCode(item.code);
}
