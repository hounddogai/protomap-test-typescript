import {
  normalizeRegionalCreditAuditCode,
} from "../../credit/primary-credit-request/regional-credit-audit-policy.js";
import { ScheduledCreditRequest } from "../../credit/primary-credit-request/scheduled-credit-request.js";
import { StrictPathEntry, newStrictPathEntry } from "./strict-path-entry.js";

export function summarizeScheduledCreditRequestsForEntry(items: ScheduledCreditRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveStrictPathEntriesFromRequest(items: ScheduledCreditRequest[]): StrictPathEntry[] {
  const out: StrictPathEntry[] = [];
  for (const item of items) {
    const derived = newStrictPathEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitStrictPathEntry(item: StrictPathEntry): string {
  return normalizeRegionalCreditAuditCode(item.code);
}
