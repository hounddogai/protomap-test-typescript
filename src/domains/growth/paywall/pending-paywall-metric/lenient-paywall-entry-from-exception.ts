import {
  normalizeScheduledCohortExceptionCode,
} from "../../cohort/cohort-draft/scheduled-cohort-exception-policy.js";
import { ScheduledCohortException } from "../../cohort/cohort-draft/scheduled-cohort-exception.js";
import { LenientPaywallEntry, newLenientPaywallEntry } from "./lenient-paywall-entry.js";

export function summarizeScheduledCohortExceptionsForEntry(items: ScheduledCohortException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLenientPaywallEntriesFromException(items: ScheduledCohortException[]): LenientPaywallEntry[] {
  const out: LenientPaywallEntry[] = [];
  for (const item of items) {
    const derived = newLenientPaywallEntry(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateLenientPaywallEntry(item: LenientPaywallEntry): string {
  return normalizeScheduledCohortExceptionCode(item.code);
}
