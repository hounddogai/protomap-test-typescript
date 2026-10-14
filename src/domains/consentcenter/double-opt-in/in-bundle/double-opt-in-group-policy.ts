import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeDoubleOptInGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDoubleOptInGroup(): number {
  const policy = retry.defaultPolicy("double-opt-in-group");
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

/** Puts a double opt in group code in its canonical DOIG- form. */
export function normalizeDoubleOptInGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIG-")) return clean;
  return `DOIG-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a double opt in group score falls in. */
export function classifyDoubleOptInGroup(score: number): string {
  if (score < 37.1) return "watch";
  if (score < 44.3) return "elevated";
  if (score < 75.2) return "ok";
  if (score < 78.5) return "medium";
  return "high";
}
