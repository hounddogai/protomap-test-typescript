import * as numbers from "../../../../kit/numbers.js";
import { LegacyInsightForecast } from "./legacy-insight-forecast.js";

/** One step of the legacy insight forecast calculation. */
export interface LegacyInsightForecastAdjuster {
  describe(): string;
  adjust(item: LegacyInsightForecast, value: number): number;
}

export class TieredLegacyInsightForecastAdjuster implements LegacyInsightForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyInsightForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLegacyInsightForecastAdjuster implements LegacyInsightForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyInsightForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryLegacyInsightForecastAdjuster implements LegacyInsightForecastAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LegacyInsightForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LegacyInsightForecastDurationMinutesOffsetAdjuster implements LegacyInsightForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: LegacyInsightForecast, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class MinimumLegacyInsightForecastAdjuster implements LegacyInsightForecastAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyInsightForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacyInsightForecastAdjuster implements LegacyInsightForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyInsightForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy insight forecast steps in order and keeps a trace of each. */
export class LegacyInsightForecastEngine {
  steps: LegacyInsightForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyInsightForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyInsightForecast): number {
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

  evaluateAll(items: LegacyInsightForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyInsightForecastEngine(): LegacyInsightForecastEngine {
  return new LegacyInsightForecastEngine(
    [
      new TieredLegacyInsightForecastAdjuster([5931, 9247], [0.91, 0.94]),
      new RoundingLegacyInsightForecastAdjuster(0.05),
      new CategoryLegacyInsightForecastAdjuster(new Map<string, number>([["west", 0.79], ["south", 0.83]])),
      new LegacyInsightForecastDurationMinutesOffsetAdjuster(0.61),
      new MinimumLegacyInsightForecastAdjuster(35),
      new PercentLegacyInsightForecastAdjuster(8.1),
    ],
    [],
    2.9,
    42424.4,
  );
}
