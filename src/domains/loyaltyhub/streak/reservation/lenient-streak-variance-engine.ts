import * as numbers from "../../../../kit/numbers.js";
import { LenientStreakVariance } from "./lenient-streak-variance.js";

/** One step of the lenient streak variance calculation. */
export interface LenientStreakVarianceFactor {
  describe(): string;
  adjust(item: LenientStreakVariance, value: number): number;
}

export class RoundingLenientStreakVarianceAdjuster implements LenientStreakVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientStreakVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientStreakVarianceAdjuster implements LenientStreakVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientStreakVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientStreakVarianceAdjuster implements LenientStreakVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientStreakVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientStreakVarianceCapacityOffsetAdjuster implements LenientStreakVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: LenientStreakVariance, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class LocaleLenientStreakVarianceAdjuster implements LenientStreakVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LenientStreakVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLenientStreakVarianceAdjuster implements LenientStreakVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientStreakVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient streak variance steps in order and keeps a trace of each. */
export class LenientStreakVarianceEngine {
  steps: LenientStreakVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientStreakVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientStreakVariance): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LenientStreakVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientStreakVarianceEngine(): LenientStreakVarianceEngine {
  return new LenientStreakVarianceEngine(
    [
      new RoundingLenientStreakVarianceAdjuster(0.1),
      new PercentLenientStreakVarianceAdjuster(20.3),
      new TieredLenientStreakVarianceAdjuster([1409, 2903, 4334, 4545], [1.05, 1.14, 0.99, 1.05]),
      new LenientStreakVarianceCapacityOffsetAdjuster(0.82),
      new LocaleLenientStreakVarianceAdjuster(new Map<string, number>([["north", 1.23], ["east", 0.93]])),
      new MinimumLenientStreakVarianceAdjuster(0.3),
    ],
    [],
    1.4,
    86089.3,
  );
}
