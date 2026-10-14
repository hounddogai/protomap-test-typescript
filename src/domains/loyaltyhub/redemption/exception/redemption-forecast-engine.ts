import * as flags from "../../../../kit/flags.js";
import { RedemptionForecast } from "./redemption-forecast.js";

/** One step of the redemption forecast calculation. */
export interface RedemptionForecastModifier {
  describe(): string;
  adjust(item: RedemptionForecast, value: number): number;
}

export class CapRedemptionForecastAdjuster implements RedemptionForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRedemptionForecastAdjuster implements RedemptionForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRedemptionForecastAdjuster implements RedemptionForecastModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: RedemptionForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRedemptionForecastAdjuster implements RedemptionForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRedemptionForecastAdjuster implements RedemptionForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the redemption forecast steps in order and keeps a trace of each. */
export class RedemptionForecastEngine {
  steps: RedemptionForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionForecast): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RedemptionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionForecastEngine(flagsValue: flags.Registry): RedemptionForecastEngine {
  return new RedemptionForecastEngine(
    [
      new CapRedemptionForecastAdjuster(40536),
      new MinimumRedemptionForecastAdjuster(8.1),
      new FlaggedRedemptionForecastAdjuster(flagsValue, "redemption-forecast-batched", -2.9),
      new TieredRedemptionForecastAdjuster([5484, 7222, 7446, 8600], [1.05, 1.05, 0.98, 0.89]),
      new PercentRedemptionForecastAdjuster(-5.7),
    ],
    [],
    1.2,
    35702.2,
  );
}
