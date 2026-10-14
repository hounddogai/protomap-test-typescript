import { OptOutEntry } from "../../opt-out/rule/opt-out-entry.js";
import { normalizeTieredOptOutCycleCode } from "../../opt-out/rule/tiered-opt-out-cycle-policy.js";
import {
  ScheduledSuppressionException,
  newScheduledSuppressionException,
} from "./scheduled-suppression-exception.js";

export function summarizeOptOutEntriesForException(items: OptOutEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveScheduledSuppressionExceptionsFromEntry(items: OptOutEntry[]): ScheduledSuppressionException[] {
  const out: ScheduledSuppressionException[] = [];
  for (const item of items) {
    const derived = newScheduledSuppressionException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceScheduledSuppressionException(item: ScheduledSuppressionException): string {
  return normalizeTieredOptOutCycleCode(item.code);
}
