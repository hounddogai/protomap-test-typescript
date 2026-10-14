import {
  normalizeManualRetentionAgreementCode,
} from "../../retention/retention-allocation/manual-retention-agreement-policy.js";
import { ScheduledRetentionAllocation } from "../../retention/retention-allocation/scheduled-retention-allocation.js";
import { ActivationEntry, newActivationEntry } from "./activation-entry.js";

export function summarizeScheduledRetentionAllocationsForEntry(items: ScheduledRetentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveActivationEntriesFromAllocation(items: ScheduledRetentionAllocation[]): ActivationEntry[] {
  const out: ActivationEntry[] = [];
  for (const item of items) {
    const derived = newActivationEntry(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitActivationEntry(item: ActivationEntry): string {
  return normalizeManualRetentionAgreementCode(item.code);
}
