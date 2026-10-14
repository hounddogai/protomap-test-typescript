import { strictLevelAssignmentWeight } from "../batched-level-cycle/strict-level-assignment-policy.js";
import { StrictLevelAssignment } from "../batched-level-cycle/strict-level-assignment.js";
import { LevelManifest, newLevelManifest } from "./level-manifest.js";

export function summarizeStrictLevelAssignmentsForManifest(items: StrictLevelAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLevelManifestsFromAssignment(items: StrictLevelAssignment[]): LevelManifest[] {
  const out: LevelManifest[] = [];
  for (const item of items) {
    const derived = newLevelManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLevelManifest(item: LevelManifest): number {
  return strictLevelAssignmentWeight(5, true);
}
