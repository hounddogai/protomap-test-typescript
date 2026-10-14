import { normalizePaywallCheckpointCode } from "../../paywall/schedule/paywall-checkpoint-policy.js";
import { PaywallCheckpoint } from "../../paywall/schedule/paywall-checkpoint.js";
import { RollingNudgeTarget, newRollingNudgeTarget } from "./rolling-nudge-target.js";

export function summarizePaywallCheckpointsForTarget(items: PaywallCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingNudgeTargetsFromCheckpoint(items: PaywallCheckpoint[]): RollingNudgeTarget[] {
  const out: RollingNudgeTarget[] = [];
  for (const item of items) {
    const derived = newRollingNudgeTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRollingNudgeTarget(item: RollingNudgeTarget): string {
  return normalizePaywallCheckpointCode(item.code);
}
