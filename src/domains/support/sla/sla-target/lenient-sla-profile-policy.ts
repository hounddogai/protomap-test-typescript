import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientSlaProfile(): number {
  const policy = retry.defaultPolicy("lenient-sla-profile");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a lenient sla profile score falls in. */
export function classifyLenientSlaProfile(score: number): string {
  if (score < 9.8) return "minimal";
  if (score < 33.4) return "critical";
  if (score < 48.3) return "ok";
  if (score < 64.9) return "medium";
  return "watch";
}

/** Puts a lenient sla profile code in its canonical LSP- form. */
export function normalizeLenientSlaProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSP-")) return clean;
  return `LSP-${clean.replaceAll(" ", "-")}`;
}

export function lenientSlaProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
