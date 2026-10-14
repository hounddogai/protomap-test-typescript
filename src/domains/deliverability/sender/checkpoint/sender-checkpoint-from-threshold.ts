import { classifyDomainRollup } from "../../domain/budget/domain-rollup-policy.js";
import { PendingDomainThreshold } from "../../domain/budget/pending-domain-threshold.js";
import { SenderCheckpoint, newSenderCheckpoint } from "./sender-checkpoint.js";

export function summarizePendingDomainThresholdsForCheckpoint(items: PendingDomainThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveSenderCheckpointsFromThreshold(items: PendingDomainThreshold[]): SenderCheckpoint[] {
  const out: SenderCheckpoint[] = [];
  for (const item of items) {
    const derived = newSenderCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveSenderCheckpoint(item: SenderCheckpoint): string {
  return classifyDomainRollup(item.weightedVolume());
}
