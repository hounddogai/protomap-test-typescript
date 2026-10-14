import * as numbers from "../../../../kit/numbers.js";

export function primarySenderAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a primary sender agreement score falls in. */
export function classifyPrimarySenderAgreement(score: number): string {
  if (score < 34.2) return "high";
  if (score < 71) return "low";
  if (score < 89.5) return "minimal";
  return "critical";
}
