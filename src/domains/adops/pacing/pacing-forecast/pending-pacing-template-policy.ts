import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a pending pacing template code in its canonical PPT- form. */
export function normalizePendingPacingTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPT-")) return clean;
  return `PPT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a pending pacing template score falls in. */
export function classifyPendingPacingTemplate(score: number): string {
  if (score < 15.3) return "ok";
  if (score < 87) return "elevated";
  if (score < 98.1) return "high";
  return "medium";
}

export function pendingPacingTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingPacingTemplate(): number {
  const policy = retry.defaultPolicy("pending-pacing-template");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
