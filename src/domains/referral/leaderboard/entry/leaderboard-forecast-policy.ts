import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLeaderboardForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a leaderboard forecast score falls in. */
export function classifyLeaderboardForecast(score: number): string {
  if (score < 3.2) return "elevated";
  if (score < 9.1) return "high";
  if (score < 13.9) return "critical";
  if (score < 80.9) return "medium";
  return "watch";
}
