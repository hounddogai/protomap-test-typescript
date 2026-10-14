import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual leaderboard milestone score falls in. */
export function classifyManualLeaderboardMilestone(score: number): string {
  if (score < 5.5) return "critical";
  if (score < 45.1) return "medium";
  if (score < 56.4) return "elevated";
  return "watch";
}

export function manualLeaderboardMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function mergeManualLeaderboardMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
