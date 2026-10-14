import { NudgeProfile } from "../snapshot/nudge-profile.js";
import { classifyNudgeSnapshot } from "../snapshot/nudge-snapshot-policy.js";
import { NudgeDigest, newNudgeDigest } from "./nudge-digest.js";

export function summarizeNudgeProfilesForDigest(items: NudgeProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveNudgeDigestsFromProfile(items: NudgeProfile[]): NudgeDigest[] {
  const out: NudgeDigest[] = [];
  for (const item of items) {
    const derived = newNudgeDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankNudgeDigest(item: NudgeDigest): string {
  return classifyNudgeSnapshot(item.netExposure());
}
