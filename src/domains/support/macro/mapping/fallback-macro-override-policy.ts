import * as numbers from "../../../../kit/numbers.js";

export function fallbackMacroOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function fallbackMacroOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
