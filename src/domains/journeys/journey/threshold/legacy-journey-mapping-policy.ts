import * as retry from "../../../../kit/retry.js";

/** Puts a legacy journey mapping code in its canonical LJM- form. */
export function normalizeLegacyJourneyMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LJM-")) return clean;
  return `LJM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyJourneyMapping(): number {
  const policy = retry.defaultPolicy("legacy-journey-mapping");
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

/** Counts how many amounts fit in a budget of 94701.0, in order. */
export function legacyJourneyMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94701) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
