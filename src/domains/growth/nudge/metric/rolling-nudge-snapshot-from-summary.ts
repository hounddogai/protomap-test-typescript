import { activationRequestWeight } from "../../activation/activation-summary/activation-request-policy.js";
import { RollingActivationSummary } from "../../activation/activation-summary/rolling-activation-summary.js";
import { RollingNudgeSnapshot, newRollingNudgeSnapshot } from "./rolling-nudge-snapshot.js";

export function summarizeRollingActivationSummariesForSnapshot(items: RollingActivationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingNudgeSnapshotsFromSummary(items: RollingActivationSummary[]): RollingNudgeSnapshot[] {
  const out: RollingNudgeSnapshot[] = [];
  for (const item of items) {
    const derived = newRollingNudgeSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planRollingNudgeSnapshot(item: RollingNudgeSnapshot): number {
  return activationRequestWeight(3, true);
}
