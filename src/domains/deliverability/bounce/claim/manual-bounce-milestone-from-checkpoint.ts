import { SenderCheckpoint } from "../../sender/checkpoint/sender-checkpoint.js";
import { senderReservationWeight } from "../../sender/checkpoint/sender-reservation-policy.js";
import { ManualBounceMilestone, newManualBounceMilestone } from "./manual-bounce-milestone.js";

export function summarizeSenderCheckpointsForMilestone(items: SenderCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveManualBounceMilestonesFromCheckpoint(items: SenderCheckpoint[]): ManualBounceMilestone[] {
  const out: ManualBounceMilestone[] = [];
  for (const item of items) {
    const derived = newManualBounceMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualBounceMilestone(item: ManualBounceMilestone): number {
  return senderReservationWeight(1, true);
}
