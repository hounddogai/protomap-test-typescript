import * as numbers from "../../../../kit/numbers.js";
import { LenientPathRollup } from "./lenient-path-rollup.js";

/** One step of the lenient path rollup calculation. */
export interface LenientPathRollupModifier {
  describe(): string;
  adjust(item: LenientPathRollup, value: number): number;
}

export class TieredLenientPathRollupAdjuster implements LenientPathRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPathRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientPathRollupAdjuster implements LenientPathRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPathRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientPathRollupAdjuster implements LenientPathRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPathRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientPathRollupAdjuster implements LenientPathRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPathRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLenientPathRollupAdjuster implements LenientPathRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPathRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient path rollup steps in order and keeps a trace of each. */
export class LenientPathRollupEngine {
  steps: LenientPathRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPathRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientPathRollup): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LenientPathRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientPathRollupEngine(): LenientPathRollupEngine {
  return new LenientPathRollupEngine(
    [
      new TieredLenientPathRollupAdjuster([463, 1622, 1697], [0.88, 0.89, 1.11]),
      new RoundingLenientPathRollupAdjuster(0.05),
      new PercentLenientPathRollupAdjuster(-11.7),
      new MinimumLenientPathRollupAdjuster(46.4),
      new CapLenientPathRollupAdjuster(49548),
    ],
    [],
    2.3,
    61002.3,
  );
}
