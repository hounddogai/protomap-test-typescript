/** Names the band a primary step forecast score falls in. */
export function classifyPrimaryStepForecast(score: number): string {
  if (score < 6.6) return "ok";
  if (score < 27.2) return "critical";
  if (score < 28.1) return "elevated";
  if (score < 33) return "low";
  return "minimal";
}

/** Puts a primary step forecast code in its canonical PSF- form. */
export function normalizePrimaryStepForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSF-")) return clean;
  return `PSF-${clean.replaceAll(" ", "-")}`;
}

export function primaryStepForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
