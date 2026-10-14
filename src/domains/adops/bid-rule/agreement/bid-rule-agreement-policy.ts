import * as numbers from "../../../../kit/numbers.js";

/** Names the band a bid rule agreement score falls in. */
export function classifyBidRuleAgreement(score: number): string {
  if (score < 20.1) return "critical";
  if (score < 54.8) return "watch";
  if (score < 80) return "minimal";
  return "elevated";
}

export function bidRuleAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function bidRuleAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
