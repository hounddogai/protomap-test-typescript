import * as numbers from "../../../../kit/numbers.js";
import { RollingRedemptionVariance } from "./rolling-redemption-variance.js";

/** One step of the rolling redemption variance calculation. */
export interface RollingRedemptionVarianceAdjuster {
  describe(): string;
  adjust(item: RollingRedemptionVariance, value: number): number;
}

export class PercentRollingRedemptionVarianceAdjuster implements RollingRedemptionVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingRedemptionVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceRollingRedemptionVarianceAdjuster implements RollingRedemptionVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RollingRedemptionVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingRedemptionVarianceVersionOffsetAdjuster implements RollingRedemptionVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RollingRedemptionVariance, value: number): number {
    return value + item.version * this.weight;
  }
}

export class TieredRollingRedemptionVarianceAdjuster implements RollingRedemptionVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingRedemptionVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRollingRedemptionVarianceAdjuster implements RollingRedemptionVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingRedemptionVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingRedemptionVarianceAdjuster implements RollingRedemptionVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingRedemptionVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling redemption variance steps in order and keeps a trace of each. */
export class RollingRedemptionVarianceEngine {
  steps: RollingRedemptionVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRedemptionVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingRedemptionVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingRedemptionVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingRedemptionVarianceEngine(): RollingRedemptionVarianceEngine {
  return new RollingRedemptionVarianceEngine(
    [
      new PercentRollingRedemptionVarianceAdjuster(-0.8),
      new SourceRollingRedemptionVarianceAdjuster(new Map<string, number>([["east", 1.33]])),
      new RollingRedemptionVarianceVersionOffsetAdjuster(0.18),
      new TieredRollingRedemptionVarianceAdjuster([2910, 7023, 7339], [1, 0.95, 1.08]),
      new RoundingRollingRedemptionVarianceAdjuster(5),
      new MinimumRollingRedemptionVarianceAdjuster(34),
    ],
    [],
    4.7,
    88173.3,
  );
}
