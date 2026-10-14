import { lenientPostSnapshotWeight } from "../../post/post-schedule/lenient-post-snapshot-policy.js";
import { LenientPostSnapshot } from "../../post/post-schedule/lenient-post-snapshot.js";
import { CappedMentionPolicy, newCappedMentionPolicy } from "./capped-mention-policy.js";

export function summarizeLenientPostSnapshotsForPolicy(items: LenientPostSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveCappedMentionPoliciesFromSnapshot(items: LenientPostSnapshot[]): CappedMentionPolicy[] {
  const out: CappedMentionPolicy[] = [];
  for (const item of items) {
    const derived = newCappedMentionPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCappedMentionPolicy(item: CappedMentionPolicy): number {
  return lenientPostSnapshotWeight(8, true);
}
