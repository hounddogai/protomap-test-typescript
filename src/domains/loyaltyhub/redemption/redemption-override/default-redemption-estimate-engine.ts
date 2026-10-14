import * as numbers from "../../../../kit/numbers.js";
import { DefaultRedemptionEstimate } from "./default-redemption-estimate.js";

/** One step of the default redemption estimate calculation. */
export interface DefaultRedemptionEstimateFactor {
  describe(): string;
  adjust(item: DefaultRedemptionEstimate, value: number): number;
}

export class MinimumDefaultRedemptionEstimateAdjuster implements DefaultRedemptionEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultRedemptionEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultRedemptionEstimateAdjuster implements DefaultRedemptionEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultRedemptionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DefaultRedemptionEstimateWindowDaysOffsetAdjuster implements DefaultRedemptionEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: DefaultRedemptionEstimate, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class UnitDefaultRedemptionEstimateAdjuster implements DefaultRedemptionEstimateFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: DefaultRedemptionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingDefaultRedemptionEstimateAdjuster implements DefaultRedemptionEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultRedemptionEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultRedemptionEstimateAdjuster implements DefaultRedemptionEstimateFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultRedemptionEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default redemption estimate steps in order and keeps a trace of each. */
export class DefaultRedemptionEstimateEngine {
  steps: DefaultRedemptionEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultRedemptionEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultRedemptionEstimate): number {
    let current = item.netTotal();
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

  evaluateAll(items: DefaultRedemptionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultRedemptionEstimateEngine(): DefaultRedemptionEstimateEngine {
  return new DefaultRedemptionEstimateEngine(
    [
      new MinimumDefaultRedemptionEstimateAdjuster(19.9),
      new CapDefaultRedemptionEstimateAdjuster(21229),
      new DefaultRedemptionEstimateWindowDaysOffsetAdjuster(1.67),
      new UnitDefaultRedemptionEstimateAdjuster(new Map<string, number>([["north", 1.38]])),
      new RoundingDefaultRedemptionEstimateAdjuster(0.05),
      new PercentDefaultRedemptionEstimateAdjuster(0.4),
    ],
    [],
    1.2,
    8862.3,
  );
}
