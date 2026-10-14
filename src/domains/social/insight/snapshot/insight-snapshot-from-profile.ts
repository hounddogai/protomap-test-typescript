import { normalizeMentionProfileCode } from "../../mention/claim/mention-profile-policy.js";
import { MentionProfile } from "../../mention/claim/mention-profile.js";
import { InsightSnapshot, newInsightSnapshot } from "./insight-snapshot.js";

export function summarizeMentionProfilesForSnapshot(items: MentionProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveInsightSnapshotsFromProfile(items: MentionProfile[]): InsightSnapshot[] {
  const out: InsightSnapshot[] = [];
  for (const item of items) {
    const derived = newInsightSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyInsightSnapshotExtra(item: InsightSnapshot): string {
  return normalizeMentionProfileCode(item.code);
}
