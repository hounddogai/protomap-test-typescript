import { mentionAssignmentBucket } from "../../mention/assignment/mention-assignment-policy.js";
import { MentionAssignment } from "../../mention/assignment/mention-assignment.js";
import { PostManifest, newPostManifest } from "./post-manifest.js";

export function summarizeMentionAssignmentsForManifest(items: MentionAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePostManifestsFromAssignment(items: MentionAssignment[]): PostManifest[] {
  const out: PostManifest[] = [];
  for (const item of items) {
    const derived = newPostManifest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergePostManifest(item: PostManifest): string {
  return mentionAssignmentBucket(item.projectedTotal());
}
