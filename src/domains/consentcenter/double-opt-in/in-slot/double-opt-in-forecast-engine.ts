import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInForecast } from "./double-opt-in-forecast.js";

/** One step of the double opt in forecast calculation. */
export interface DoubleOptInForecastFactor {
  describe(): string;
  adjust(item: DoubleOptInForecast, value: number): number;
}

export class CapDoubleOptInForecastAdjuster implements DoubleOptInForecastFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class DoubleOptInForecastUpdatedAtOffsetAdjuster implements DoubleOptInForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: DoubleOptInForecast, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class PercentDoubleOptInForecastAdjuster implements DoubleOptInForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in forecast steps in order and keeps a trace of each. */
export class DoubleOptInForecastEngine {
  steps: DoubleOptInForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DoubleOptInForecast): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: DoubleOptInForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDoubleOptInForecastEngine(): DoubleOptInForecastEngine {
  return new DoubleOptInForecastEngine(
    [
      new CapDoubleOptInForecastAdjuster(43844),
      new DoubleOptInForecastUpdatedAtOffsetAdjuster(1.53),
      new PercentDoubleOptInForecastAdjuster(16.2),
    ],
    [],
    4.9,
    68996.1,
  );
}
