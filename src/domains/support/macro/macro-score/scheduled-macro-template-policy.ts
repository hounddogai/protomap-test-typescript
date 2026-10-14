import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a scheduled macro template code in its canonical SMT- form. */
export function normalizeScheduledMacroTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMT-")) return clean;
  return `SMT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledMacroTemplate(): number {
  const policy = retry.defaultPolicy("scheduled-macro-template");
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

/** Names the band a scheduled macro template score falls in. */
export function classifyScheduledMacroTemplate(score: number): string {
  if (score < 14.9) return "elevated";
  if (score < 58.4) return "watch";
  return "critical";
}

export function scheduledMacroTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
