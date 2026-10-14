import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive placement template score falls in. */
export function classifyAdaptivePlacementTemplate(score: number): string {
  if (score < 26.1) return "medium";
  if (score < 41.7) return "watch";
  if (score < 87.1) return "critical";
  return "elevated";
}

/** Puts a adaptive placement template code in its canonical APT- form. */
export function normalizeAdaptivePlacementTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APT-")) return clean;
  return `APT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePlacementTemplate(): number {
  const policy = retry.defaultPolicy("adaptive-placement-template");
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

export function mergeAdaptivePlacementTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
