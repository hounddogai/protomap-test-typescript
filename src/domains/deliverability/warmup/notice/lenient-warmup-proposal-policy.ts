/** Puts a lenient warmup proposal code in its canonical LWP- form. */
export function normalizeLenientWarmupProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWP-")) return clean;
  return `LWP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient warmup proposal score falls in. */
export function classifyLenientWarmupProposal(score: number): string {
  if (score < 86.3) return "minimal";
  if (score < 92.6) return "ok";
  if (score < 93.5) return "elevated";
  return "low";
}
