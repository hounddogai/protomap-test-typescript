import * as numbers from "../../../../kit/numbers.js";
import { TierForecast } from "./tier-forecast.js";

/** One step of the tier forecast calculation. */
export interface TierForecastFactor {
  describe(): string;
  adjust(item: TierForecast, value: number): number;
}

export class PercentTierForecastAdjuster implements TierForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelTierForecastAdjuster implements TierForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TierForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTierForecastAdjuster implements TierForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTierForecastAdjuster implements TierForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tier forecast steps in order and keeps a trace of each. */
export class TierForecastEngine {
  steps: TierForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TierForecast): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: TierForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTierForecastEngine(): TierForecastEngine {
  return new TierForecastEngine(
    [
      new PercentTierForecastAdjuster(-6.9),
      new LabelTierForecastAdjuster(new Map<string, number>([["online", 1], ["retail", 0.78], ["north", 1.4]])),
      new MinimumTierForecastAdjuster(30.1),
      new RoundingTierForecastAdjuster(0.5),
    ],
    [],
    4.2,
    69177.5,
  );
}
