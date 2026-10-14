import { mentionAssignmentBucket } from "../../mention/assignment/mention-assignment-policy.js";
import { MentionAssignment } from "../../mention/assignment/mention-assignment.js";
import { InsightMapping, newInsightMapping } from "./insight-mapping.js";

export function summarizeMentionAssignmentsForMapping(items: MentionAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveInsightMappingsFromAssignment(items: MentionAssignment[]): InsightMapping[] {
  const out: InsightMapping[] = [];
  for (const item of items) {
    const derived = newInsightMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyInsightMapping(item: InsightMapping): string {
  return mentionAssignmentBucket(item.projectedTotal());
}
