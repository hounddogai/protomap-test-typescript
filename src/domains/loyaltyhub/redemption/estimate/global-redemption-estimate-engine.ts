import * as numbers from "../../../../kit/numbers.js";
import { GlobalRedemptionEstimate } from "./global-redemption-estimate.js";

/** One step of the global redemption estimate calculation. */
export interface GlobalRedemptionEstimateStep {
  describe(): string;
  adjust(item: GlobalRedemptionEstimate, value: number): number;
}

export class GlobalRedemptionEstimateConversionRateOffsetAdjuster implements GlobalRedemptionEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: GlobalRedemptionEstimate, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class TieredGlobalRedemptionEstimateAdjuster implements GlobalRedemptionEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalRedemptionEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumGlobalRedemptionEstimateAdjuster implements GlobalRedemptionEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalRedemptionEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalRedemptionEstimateAdjuster implements GlobalRedemptionEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalRedemptionEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentGlobalRedemptionEstimateAdjuster implements GlobalRedemptionEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalRedemptionEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelGlobalRedemptionEstimateAdjuster implements GlobalRedemptionEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalRedemptionEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global redemption estimate steps in order and keeps a trace of each. */
export class GlobalRedemptionEstimateEngine {
  steps: GlobalRedemptionEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalRedemptionEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalRedemptionEstimate): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: GlobalRedemptionEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalRedemptionEstimateEngine(): GlobalRedemptionEstimateEngine {
  return new GlobalRedemptionEstimateEngine(
    [
      new GlobalRedemptionEstimateConversionRateOffsetAdjuster(1.39),
      new TieredGlobalRedemptionEstimateAdjuster([2605, 8255, 9040], [1.13, 1.02, 0.89]),
      new MinimumGlobalRedemptionEstimateAdjuster(10.9),
      new CapGlobalRedemptionEstimateAdjuster(14439),
      new PercentGlobalRedemptionEstimateAdjuster(20.1),
      new ChannelGlobalRedemptionEstimateAdjuster(new Map<string, number>([["south", 1.3], ["online", 0.94]])),
    ],
    [],
    2.4,
    2786.1,
  );
}
