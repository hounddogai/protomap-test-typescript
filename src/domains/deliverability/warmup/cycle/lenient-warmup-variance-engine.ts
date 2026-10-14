import * as numbers from "../../../../kit/numbers.js";
import { LenientWarmupVariance } from "./lenient-warmup-variance.js";

/** One step of the lenient warmup variance calculation. */
export interface LenientWarmupVarianceStep {
  describe(): string;
  adjust(item: LenientWarmupVariance, value: number): number;
}

export class TieredLenientWarmupVarianceAdjuster implements LenientWarmupVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientWarmupVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientWarmupVarianceAdjuster implements LenientWarmupVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientWarmupVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientWarmupVarianceAdjuster implements LenientWarmupVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientWarmupVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLenientWarmupVarianceAdjuster implements LenientWarmupVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientWarmupVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient warmup variance steps in order and keeps a trace of each. */
export class LenientWarmupVarianceEngine {
  steps: LenientWarmupVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientWarmupVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientWarmupVariance): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: LenientWarmupVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientWarmupVarianceEngine(): LenientWarmupVarianceEngine {
  return new LenientWarmupVarianceEngine(
    [
      new TieredLenientWarmupVarianceAdjuster([446, 7918], [0.98, 1.1]),
      new CapLenientWarmupVarianceAdjuster(12913),
      new MinimumLenientWarmupVarianceAdjuster(26.5),
      new RoundingLenientWarmupVarianceAdjuster(0.25),
    ],
    [],
    0.2,
    47443,
  );
}
