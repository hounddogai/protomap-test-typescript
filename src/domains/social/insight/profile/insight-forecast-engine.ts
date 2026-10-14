import * as numbers from "../../../../kit/numbers.js";
import { InsightForecast } from "./insight-forecast.js";

/** One step of the insight forecast calculation. */
export interface InsightForecastFactor {
  describe(): string;
  adjust(item: InsightForecast, value: number): number;
}

export class InsightForecastWindowDaysOffsetAdjuster implements InsightForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: InsightForecast, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class MinimumInsightForecastAdjuster implements InsightForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredInsightForecastAdjuster implements InsightForecastFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingInsightForecastAdjuster implements InsightForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapInsightForecastAdjuster implements InsightForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentInsightForecastAdjuster implements InsightForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight forecast steps in order and keeps a trace of each. */
export class InsightForecastEngine {
  steps: InsightForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightForecast): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: InsightForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightForecastEngine(): InsightForecastEngine {
  return new InsightForecastEngine(
    [
      new InsightForecastWindowDaysOffsetAdjuster(1.01),
      new MinimumInsightForecastAdjuster(29.9),
      new TieredInsightForecastAdjuster([617, 2866, 6766], [1.08, 1.18, 1.16]),
      new RoundingInsightForecastAdjuster(0.05),
      new CapInsightForecastAdjuster(28380),
      new PercentInsightForecastAdjuster(-6.1),
    ],
    [],
    4,
    70679,
  );
}
