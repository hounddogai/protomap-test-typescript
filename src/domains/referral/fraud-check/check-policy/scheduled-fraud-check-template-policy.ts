import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled fraud check template code in its canonical SFCT- form. */
export function normalizeScheduledFraudCheckTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFCT-")) return clean;
  return `SFCT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled fraud check template score falls in. */
export function classifyScheduledFraudCheckTemplate(score: number): string {
  if (score < 12.7) return "critical";
  if (score < 42.5) return "ok";
  if (score < 48.6) return "high";
  if (score < 92.9) return "watch";
  return "low";
}

export function scheduledFraudCheckTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function scheduledFraudCheckTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
