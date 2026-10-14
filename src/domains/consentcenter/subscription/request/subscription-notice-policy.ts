/** Counts how many amounts fit in a budget of 99311.0, in order. */
export function subscriptionNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99311) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a subscription notice code in its canonical SN- form. */
export function normalizeSubscriptionNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SN-")) return clean;
  return `SN-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a subscription notice score falls in. */
export function classifySubscriptionNotice(score: number): string {
  if (score < 16.9) return "elevated";
  if (score < 50.9) return "medium";
  if (score < 58.3) return "ok";
  if (score < 59.9) return "low";
  return "watch";
}
