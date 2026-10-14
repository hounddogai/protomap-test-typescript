import * as numbers from "../../../../kit/numbers.js";
import { RollingOptOutException } from "./rolling-opt-out-exception.js";

/** One step of the rolling opt out exception calculation. */
export interface RollingOptOutExceptionAdjuster {
  describe(): string;
  adjust(item: RollingOptOutException, value: number): number;
}

export class PercentRollingOptOutExceptionAdjuster implements RollingOptOutExceptionAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingOptOutException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingOptOutExceptionAdjuster implements RollingOptOutExceptionAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingOptOutException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRollingOptOutExceptionAdjuster implements RollingOptOutExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingOptOutException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingOptOutExceptionAdjuster implements RollingOptOutExceptionAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingOptOutException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling opt out exception steps in order and keeps a trace of each. */
export class RollingOptOutExceptionEngine {
  steps: RollingOptOutExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingOptOutExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingOptOutException): number {
    let current = item.netLoad();
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

  evaluateAll(items: RollingOptOutException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingOptOutExceptionEngine(): RollingOptOutExceptionEngine {
  return new RollingOptOutExceptionEngine(
    [
      new PercentRollingOptOutExceptionAdjuster(-21.3),
      new TieredRollingOptOutExceptionAdjuster([1322, 7472, 7936, 8524], [1.06, 1.19, 0.97, 1.14]),
      new RoundingRollingOptOutExceptionAdjuster(1),
      new MinimumRollingOptOutExceptionAdjuster(31.7),
    ],
    [],
    3.9,
    43173.2,
  );
}
