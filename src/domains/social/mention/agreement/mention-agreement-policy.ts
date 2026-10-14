import * as numbers from "../../../../kit/numbers.js";

export function mentionAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a mention agreement code in its canonical MA- form. */
export function normalizeMentionAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MA-")) return clean;
  return `MA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a mention agreement score falls in. */
export function classifyMentionAgreement(score: number): string {
  if (score < 56.2) return "ok";
  if (score < 65.9) return "minimal";
  return "watch";
}
