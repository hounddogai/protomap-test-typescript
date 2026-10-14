import * as numbers from "../../../../kit/numbers.js";
import { LenientFlightManifest } from "./lenient-flight-manifest.js";

/** One step of the lenient flight manifest calculation. */
export interface LenientFlightManifestFactor {
  describe(): string;
  adjust(item: LenientFlightManifest, value: number): number;
}

export class PercentLenientFlightManifestAdjuster implements LenientFlightManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientFlightManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientFlightManifestAdjuster implements LenientFlightManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientFlightManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientFlightManifestAdjuster implements LenientFlightManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientFlightManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLenientFlightManifestAdjuster implements LenientFlightManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFlightManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient flight manifest steps in order and keeps a trace of each. */
export class LenientFlightManifestEngine {
  steps: LenientFlightManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFlightManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientFlightManifest): number {
    let current = item.projectedTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: LenientFlightManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientFlightManifestEngine(): LenientFlightManifestEngine {
  return new LenientFlightManifestEngine(
    [
      new PercentLenientFlightManifestAdjuster(-14.2),
      new CapLenientFlightManifestAdjuster(9714),
      new RoundingLenientFlightManifestAdjuster(0.1),
      new MinimumLenientFlightManifestAdjuster(23.6),
    ],
    [],
    4.7,
    16322.8,
  );
}
