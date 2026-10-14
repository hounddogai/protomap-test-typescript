import * as numbers from "../../../../kit/numbers.js";

/** Names the band a mention record score falls in. */
export function classifyMentionRecord(score: number): string {
  if (score < 23.7) return "ok";
  if (score < 42.4) return "minimal";
  return "medium";
}

/** Puts a mention record code in its canonical MR- form. */
export function normalizeMentionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MR-")) return clean;
  return `MR-${clean.replaceAll(" ", "-")}`;
}

export function mentionRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mentionRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
