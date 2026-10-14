import * as numbers from "../../../../kit/numbers.js";

export function regionalComplaintManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalComplaintManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
