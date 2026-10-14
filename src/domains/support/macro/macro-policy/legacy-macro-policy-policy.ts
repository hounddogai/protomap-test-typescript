import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyMacroPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyMacroPolicy(): number {
  const policy = retry.defaultPolicy("legacy-macro-policy");
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

/** Names the band a legacy macro policy score falls in. */
export function classifyLegacyMacroPolicy(score: number): string {
  if (score < 2) return "critical";
  if (score < 10.2) return "high";
  if (score < 45.8) return "minimal";
  if (score < 51.1) return "elevated";
  return "medium";
}
