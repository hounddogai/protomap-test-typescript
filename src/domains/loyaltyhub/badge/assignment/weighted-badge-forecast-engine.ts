import * as flags from "../../../../kit/flags.js";
import { WeightedBadgeForecast } from "./weighted-badge-forecast.js";

/** One step of the weighted badge forecast calculation. */
export interface WeightedBadgeForecastAdjuster {
  describe(): string;
  adjust(item: WeightedBadgeForecast, value: number): number;
}

export class WeightedBadgeForecastDiscountOffsetAdjuster implements WeightedBadgeForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: WeightedBadgeForecast, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class TieredWeightedBadgeForecastAdjuster implements WeightedBadgeForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedBadgeForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedWeightedBadgeForecastAdjuster implements WeightedBadgeForecastAdjuster {
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

  adjust(item: WeightedBadgeForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted badge forecast steps in order and keeps a trace of each. */
export class WeightedBadgeForecastEngine {
  steps: WeightedBadgeForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedBadgeForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedBadgeForecast): number {
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

  evaluateAll(items: WeightedBadgeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedBadgeForecastEngine(flagsValue: flags.Registry): WeightedBadgeForecastEngine {
  return new WeightedBadgeForecastEngine(
    [
      new WeightedBadgeForecastDiscountOffsetAdjuster(0.32),
      new TieredWeightedBadgeForecastAdjuster([4911, 6835], [0.94, 0.81]),
      new FlaggedWeightedBadgeForecastAdjuster(flagsValue, "weighted-badge-forecast-batched", 3.9),
    ],
    [],
    4.5,
    95049.6,
  );
}
