import * as numbers from "../../../../kit/numbers.js";
import { RewardForecast } from "./reward-forecast.js";

/** One step of the reward forecast calculation. */
export interface RewardForecastFactor {
  describe(): string;
  adjust(item: RewardForecast, value: number): number;
}

export class TieredRewardForecastAdjuster implements RewardForecastFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RewardForecastUpdatedAtOffsetAdjuster implements RewardForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: RewardForecast, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentRewardForecastAdjuster implements RewardForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionRewardForecastAdjuster implements RewardForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RewardForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRewardForecastAdjuster implements RewardForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRewardForecastAdjuster implements RewardForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward forecast steps in order and keeps a trace of each. */
export class RewardForecastEngine {
  steps: RewardForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardForecast): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardForecastEngine(): RewardForecastEngine {
  return new RewardForecastEngine(
    [
      new TieredRewardForecastAdjuster([845, 3603, 4841, 6157], [0.94, 0.81, 1.03, 1.18]),
      new RewardForecastUpdatedAtOffsetAdjuster(1.65),
      new PercentRewardForecastAdjuster(10.6),
      new RegionRewardForecastAdjuster(
        new Map<string, number>([["central", 0.95], ["retail", 0.86], ["online", 1.36]]),
      ),
      new RoundingRewardForecastAdjuster(0.1),
      new MinimumRewardForecastAdjuster(36.4),
    ],
    [],
    2.2,
    32021.1,
  );
}
