import * as numbers from "../../../../kit/numbers.js";

/** Names the band a challenge manifest score falls in. */
export function classifyChallengeManifest(score: number): string {
  if (score < 19.3) return "high";
  if (score < 20.2) return "critical";
  if (score < 23.4) return "ok";
  return "medium";
}

/** Counts how many amounts fit in a budget of 32002.0, in order. */
export function challengeManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32002) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function challengeManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a challenge manifest code in its canonical CM- form. */
export function normalizeChallengeManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CM-")) return clean;
  return `CM-${clean.replaceAll(" ", "-")}`;
}
