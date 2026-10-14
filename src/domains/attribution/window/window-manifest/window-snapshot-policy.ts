/** Puts a window snapshot code in its canonical WS- form. */
export function normalizeWindowSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WS-")) return clean;
  return `WS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a window snapshot score falls in. */
export function classifyWindowSnapshot(score: number): string {
  if (score < 40.1) return "minimal";
  if (score < 49.6) return "watch";
  return "critical";
}
