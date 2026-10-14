/** Puts a strict branch review code in its canonical SBR- form. */
export function normalizeStrictBranchReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBR-")) return clean;
  return `SBR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict branch review score falls in. */
export function classifyStrictBranchReview(score: number): string {
  if (score < 33.5) return "ok";
  if (score < 65.5) return "minimal";
  return "low";
}
