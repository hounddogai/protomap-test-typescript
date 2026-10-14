import { DefaultSlaForecast } from "./default-sla-forecast.js";

/** One step of the default sla forecast calculation. */
export interface DefaultSlaForecastStep {
  describe(): string;
  adjust(item: DefaultSlaForecast, value: number): number;
}

export class TieredDefaultSlaForecastAdjuster implements DefaultSlaForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSlaForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDefaultSlaForecastAdjuster implements DefaultSlaForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultSlaForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDefaultSlaForecastAdjuster implements DefaultSlaForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultSlaForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default sla forecast steps in order and keeps a trace of each. */
export class DefaultSlaForecastEngine {
  steps: DefaultSlaForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSlaForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultSlaForecast): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: DefaultSlaForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultSlaForecastEngine(): DefaultSlaForecastEngine {
  return new DefaultSlaForecastEngine(
    [
      new TieredDefaultSlaForecastAdjuster([1596, 1746, 1916, 8024], [0.97, 1.13, 1.11, 0.98]),
      new CapDefaultSlaForecastAdjuster(26249),
      new PercentDefaultSlaForecastAdjuster(-4.7),
    ],
    [],
    3.8,
    6567.4,
  );
}
