/** Counts how many amounts fit in a budget of 88040.0, in order. */
export function inviteRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88040) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a invite record score falls in. */
export function classifyInviteRecord(score: number): string {
  if (score < 35.6) return "ok";
  if (score < 38.1) return "minimal";
  if (score < 66.8) return "low";
  return "critical";
}

/** Puts a invite record code in its canonical IR- form. */
export function normalizeInviteRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("IR-")) return clean;
  return `IR-${clean.replaceAll(" ", "-")}`;
}

export function inviteRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
