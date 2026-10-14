import * as numbers from "../../../../kit/numbers.js";
import { CappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

/** One step of the capped enrollment estimate calculation. */
export interface CappedEnrollmentEstimateStep {
  describe(): string;
  adjust(item: CappedEnrollmentEstimate, value: number): number;
}

export class TieredCappedEnrollmentEstimateAdjuster implements CappedEnrollmentEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedEnrollmentEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCappedEnrollmentEstimateAdjuster implements CappedEnrollmentEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedEnrollmentEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedEnrollmentEstimateMarginOffsetAdjuster implements CappedEnrollmentEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: CappedEnrollmentEstimate, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumCappedEnrollmentEstimateAdjuster implements CappedEnrollmentEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedEnrollmentEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedEnrollmentEstimateAdjuster implements CappedEnrollmentEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedEnrollmentEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped enrollment estimate steps in order and keeps a trace of each. */
export class CappedEnrollmentEstimateEngine {
  steps: CappedEnrollmentEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedEnrollmentEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedEnrollmentEstimate): number {
    let current = item.netValue();
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

  evaluateAll(items: CappedEnrollmentEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedEnrollmentEstimateEngine(): CappedEnrollmentEstimateEngine {
  return new CappedEnrollmentEstimateEngine(
    [
      new TieredCappedEnrollmentEstimateAdjuster([1202, 2083, 4583], [1.19, 0.87, 1.01]),
      new PercentCappedEnrollmentEstimateAdjuster(4.1),
      new CappedEnrollmentEstimateMarginOffsetAdjuster(0.13),
      new MinimumCappedEnrollmentEstimateAdjuster(33),
      new RoundingCappedEnrollmentEstimateAdjuster(5),
    ],
    [],
    4.2,
    42973.4,
  );
}
