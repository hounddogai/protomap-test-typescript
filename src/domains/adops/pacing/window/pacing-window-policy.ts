import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergePacingWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a pacing window score falls in. */
export function classifyPacingWindow(score: number): string {
  if (score < 14.2) return "critical";
  if (score < 72.1) return "high";
  if (score < 76.9) return "medium";
  if (score < 96.6) return "elevated";
  return "minimal";
}

/** Puts a pacing window code in its canonical PW- form. */
export function normalizePacingWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PW-")) return clean;
  return `PW-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingWindow(): number {
  const policy = retry.defaultPolicy("pacing-window");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
