import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWindowForecast } from "./seasonal-window-forecast.js";

/** One step of the seasonal window forecast calculation. */
export interface SeasonalWindowForecastAdjuster {
  describe(): string;
  adjust(item: SeasonalWindowForecast, value: number): number;
}

export class RoundingSeasonalWindowForecastAdjuster implements SeasonalWindowForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalWindowForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalWindowForecastAdjuster implements SeasonalWindowForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalWindowForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentSeasonalWindowForecastAdjuster implements SeasonalWindowForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalWindowForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalWindowForecastAdjuster implements SeasonalWindowForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalWindowForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal window forecast steps in order and keeps a trace of each. */
export class SeasonalWindowForecastEngine {
  steps: SeasonalWindowForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWindowForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalWindowForecast): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SeasonalWindowForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalWindowForecastEngine(): SeasonalWindowForecastEngine {
  return new SeasonalWindowForecastEngine(
    [
      new RoundingSeasonalWindowForecastAdjuster(5),
      new TieredSeasonalWindowForecastAdjuster([1327, 2028], [1.03, 0.82]),
      new PercentSeasonalWindowForecastAdjuster(-2.9),
      new CapSeasonalWindowForecastAdjuster(17915),
    ],
    [],
    0.5,
    99608.6,
  );
}
