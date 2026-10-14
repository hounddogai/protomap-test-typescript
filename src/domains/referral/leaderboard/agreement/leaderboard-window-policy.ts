import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a leaderboard window score falls in. */
export function classifyLeaderboardWindow(score: number): string {
  if (score < 6.5) return "elevated";
  if (score < 80.3) return "watch";
  return "low";
}

export function mergeLeaderboardWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
