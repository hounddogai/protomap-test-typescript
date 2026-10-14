import { LenientPostSnapshot } from "../../post/post-schedule/lenient-post-snapshot.js";
import { classifyTieredPostSchedule } from "../../post/post-schedule/tiered-post-schedule-policy.js";
import { QueueBundle, newQueueBundle } from "./queue-bundle.js";

export function summarizeLenientPostSnapshotsForBundle(items: LenientPostSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveQueueBundlesFromSnapshot(items: LenientPostSnapshot[]): QueueBundle[] {
  const out: QueueBundle[] = [];
  for (const item of items) {
    const derived = newQueueBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitQueueBundle(item: QueueBundle): string {
  return classifyTieredPostSchedule(item.netValue());
}
