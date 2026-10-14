import {
  classifyPrimaryTicketViewSchedule,
} from "../../ticket-view/view-claim/primary-ticket-view-schedule-policy.js";
import { PrimaryTicketViewSchedule } from "../../ticket-view/view-claim/primary-ticket-view-schedule.js";
import { GlobalMacroThreshold, newGlobalMacroThreshold } from "./global-macro-threshold.js";

export function summarizePrimaryTicketViewSchedulesForThreshold(items: PrimaryTicketViewSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveGlobalMacroThresholdsFromSchedule(items: PrimaryTicketViewSchedule[]): GlobalMacroThreshold[] {
  const out: GlobalMacroThreshold[] = [];
  for (const item of items) {
    const derived = newGlobalMacroThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveGlobalMacroThreshold(item: GlobalMacroThreshold): string {
  return classifyPrimaryTicketViewSchedule(item.adjustedTotal());
}
