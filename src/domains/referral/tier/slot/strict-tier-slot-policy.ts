import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictTierSlot(): number {
  const policy = retry.defaultPolicy("strict-tier-slot");
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

export function strictTierSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a strict tier slot score falls in. */
export function classifyStrictTierSlot(score: number): string {
  if (score < 12.9) return "ok";
  if (score < 22.8) return "medium";
  if (score < 78.6) return "high";
  return "elevated";
}

/** Puts a strict tier slot code in its canonical STS- form. */
export function normalizeStrictTierSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STS-")) return clean;
  return `STS-${clean.replaceAll(" ", "-")}`;
}
