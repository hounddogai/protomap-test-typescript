import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling macro entry code in its canonical RME- form. */
export function normalizeRollingMacroEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RME-")) return clean;
  return `RME-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling macro entry score falls in. */
export function classifyRollingMacroEntry(score: number): string {
  if (score < 24.6) return "watch";
  if (score < 72.2) return "minimal";
  if (score < 73.2) return "critical";
  if (score < 75.1) return "medium";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingMacroEntry(): number {
  const policy = retry.defaultPolicy("rolling-macro-entry");
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

export function mergeRollingMacroEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
