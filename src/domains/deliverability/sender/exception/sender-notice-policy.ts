import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a sender notice code in its canonical SN- form. */
export function normalizeSenderNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SN-")) return clean;
  return `SN-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a sender notice score falls in. */
export function classifySenderNotice(score: number): string {
  if (score < 17.9) return "high";
  if (score < 18.2) return "watch";
  if (score < 32.8) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderNotice(): number {
  const policy = retry.defaultPolicy("sender-notice");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function senderNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
