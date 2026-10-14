import * as numbers from "../../../../kit/numbers.js";
import { PayoutVariance } from "./payout-variance.js";

/** One step of the payout variance calculation. */
export interface PayoutVarianceAdjuster {
  describe(): string;
  adjust(item: PayoutVariance, value: number): number;
}

export class PayoutVarianceThresholdOffsetAdjuster implements PayoutVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PayoutVariance, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class TieredPayoutVarianceAdjuster implements PayoutVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPayoutVarianceAdjuster implements PayoutVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPayoutVarianceAdjuster implements PayoutVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPayoutVarianceAdjuster implements PayoutVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the payout variance steps in order and keeps a trace of each. */
export class PayoutVarianceEngine {
  steps: PayoutVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PayoutVariance): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PayoutVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPayoutVarianceEngine(): PayoutVarianceEngine {
  return new PayoutVarianceEngine(
    [
      new PayoutVarianceThresholdOffsetAdjuster(1.58),
      new TieredPayoutVarianceAdjuster([559, 3033, 5541], [1.01, 1.16, 0.81]),
      new RoundingPayoutVarianceAdjuster(0.5),
      new PercentPayoutVarianceAdjuster(17),
      new MinimumPayoutVarianceAdjuster(46.5),
    ],
    [],
    2.8,
    12686.6,
  );
}
