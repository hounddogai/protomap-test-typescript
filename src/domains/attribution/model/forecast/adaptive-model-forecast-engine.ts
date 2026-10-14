import { AdaptiveModelForecast } from "./adaptive-model-forecast.js";

/** One step of the adaptive model forecast calculation. */
export interface AdaptiveModelForecastModifier {
  describe(): string;
  adjust(item: AdaptiveModelForecast, value: number): number;
}

export class TieredAdaptiveModelForecastAdjuster implements AdaptiveModelForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveModelForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumAdaptiveModelForecastAdjuster implements AdaptiveModelForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveModelForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveModelForecastAdjuster implements AdaptiveModelForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveModelForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveModelForecastAdjuster implements AdaptiveModelForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveModelForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive model forecast steps in order and keeps a trace of each. */
export class AdaptiveModelForecastEngine {
  steps: AdaptiveModelForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveModelForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveModelForecast): number {
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

  evaluateAll(items: AdaptiveModelForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveModelForecastEngine(): AdaptiveModelForecastEngine {
  return new AdaptiveModelForecastEngine(
    [
      new TieredAdaptiveModelForecastAdjuster([259, 2653, 6063], [0.82, 1.11, 1.02]),
      new MinimumAdaptiveModelForecastAdjuster(31.3),
      new PercentAdaptiveModelForecastAdjuster(4.2),
      new CapAdaptiveModelForecastAdjuster(45162),
    ],
    [],
    2.5,
    81898,
  );
}
