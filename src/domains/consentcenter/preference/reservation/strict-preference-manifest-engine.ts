import * as numbers from "../../../../kit/numbers.js";
import { StrictPreferenceManifest } from "./strict-preference-manifest.js";

/** One step of the strict preference manifest calculation. */
export interface StrictPreferenceManifestStep {
  describe(): string;
  adjust(item: StrictPreferenceManifest, value: number): number;
}

export class TieredStrictPreferenceManifestAdjuster implements StrictPreferenceManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPreferenceManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictPreferenceManifestAdjuster implements StrictPreferenceManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPreferenceManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictPreferenceManifestAdjuster implements StrictPreferenceManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPreferenceManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleStrictPreferenceManifestAdjuster implements StrictPreferenceManifestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictPreferenceManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictPreferenceManifestAdjuster implements StrictPreferenceManifestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictPreferenceManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class StrictPreferenceManifestCapacityOffsetAdjuster implements StrictPreferenceManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: StrictPreferenceManifest, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the strict preference manifest steps in order and keeps a trace of each. */
export class StrictPreferenceManifestEngine {
  steps: StrictPreferenceManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPreferenceManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictPreferenceManifest): number {
    let current = item.weightedVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: StrictPreferenceManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictPreferenceManifestEngine(): StrictPreferenceManifestEngine {
  return new StrictPreferenceManifestEngine(
    [
      new TieredStrictPreferenceManifestAdjuster([945, 3233, 7085, 7638], [0.82, 1.1, 1.01, 0.81]),
      new RoundingStrictPreferenceManifestAdjuster(0.1),
      new CapStrictPreferenceManifestAdjuster(35483),
      new TitleStrictPreferenceManifestAdjuster(new Map<string, number>([["south", 0.75]])),
      new MinimumStrictPreferenceManifestAdjuster(10.6),
      new StrictPreferenceManifestCapacityOffsetAdjuster(0.67),
    ],
    [],
    3.7,
    55933.5,
  );
}
