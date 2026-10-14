import {
  classifyScheduledReputationAdjustment,
} from "../../reputation/adjustment/scheduled-reputation-adjustment-policy.js";
import { ScheduledReputationAdjustment } from "../../reputation/adjustment/scheduled-reputation-adjustment.js";
import { ManualBounceThreshold, newManualBounceThreshold } from "./manual-bounce-threshold.js";

export function summarizeScheduledReputationAdjustmentsForThreshold(items: ScheduledReputationAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualBounceThresholdsFromAdjustment(items: ScheduledReputationAdjustment[]): ManualBounceThreshold[] {
  const out: ManualBounceThreshold[] = [];
  for (const item of items) {
    const derived = newManualBounceThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeManualBounceThreshold(item: ManualBounceThreshold): string {
  return classifyScheduledReputationAdjustment(item.netVolume());
}
