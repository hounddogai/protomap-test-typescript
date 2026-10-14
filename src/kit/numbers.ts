/**
 * Arithmetic helpers: clamping, rounding, and simple statistics.
 */

export function clamp(value: number, low: number, high: number): number {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

export function clampFloat(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/** Returns part as a percentage of whole, rounded to two places, and 0 when whole is 0. */
export function percent(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round(part / whole * 100 * 100) / 100;
}

export function roundTo(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.floor(value / step + 0.5) * step;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total / values.length;
}

/** Returns the values in ascending order, leaving the input as it was. */
export function sortedFloats(values: number[]): number[] {
  const sorted = [...values];
  for (let i = 0; i < sorted.length; i++) {
    for (let k = 0; k < sorted.length - i - 1; k++) {
      if (sorted[k]! > sorted[k + 1]!) {
        const swap = sorted[k]!;
        sorted[k] = sorted[k + 1]!;
        sorted[k + 1] = swap;
      }
    }
  }
  return sorted;
}

/** Returns the p-th percentile by the nearest-rank method. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = sortedFloats(values);
  const rank = Math.trunc(p / 100 * (sorted.length - 1));
  return sorted[clamp(rank, 0, sorted.length - 1)]!;
}

export function weightedMean(values: number[], weights: number[]): number {
  if (values.length !== weights.length) {
    throw new Error(`got ${values.length} values but ${weights.length} weights`);
  }
  let sum = 0;
  let weight = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]! * weights[i]!;
    weight += weights[i]!;
  }
  if (weight === 0) return 0;
  return sum / weight;
}

export function growthRate(previous: number, current: number): number {
  if (previous === 0) return 0;
  return Math.round((current - previous) / Math.abs(previous) * 100) / 100;
}
