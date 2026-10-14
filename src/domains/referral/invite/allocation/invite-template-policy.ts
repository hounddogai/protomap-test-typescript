import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInviteTemplate(): number {
  const policy = retry.defaultPolicy("invite-template");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a invite template score falls in. */
export function classifyInviteTemplate(score: number): string {
  if (score < 19) return "minimal";
  if (score < 52.9) return "watch";
  return "critical";
}

/** Puts a invite template code in its canonical IT- form. */
export function normalizeInviteTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IT-")) return clean;
  return `IT-${clean.replaceAll(" ", "-")}`;
}
