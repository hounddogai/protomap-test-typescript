import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightPreference(): number {
  const policy = retry.defaultPolicy("insight-preference");
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

/** Puts a insight preference code in its canonical IP- form. */
export function normalizeInsightPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IP-")) return clean;
  return `IP-${clean.replaceAll(" ", "-")}`;
}

export function mergeInsightPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a insight preference score falls in. */
export function classifyInsightPreference(score: number): string {
  if (score < 84.8) return "watch";
  if (score < 91.9) return "high";
  return "critical";
}
