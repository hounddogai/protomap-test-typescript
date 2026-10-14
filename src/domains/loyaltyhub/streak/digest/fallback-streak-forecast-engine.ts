import * as numbers from "../../../../kit/numbers.js";
import { FallbackStreakForecast } from "./fallback-streak-forecast.js";

/** One step of the fallback streak forecast calculation. */
export interface FallbackStreakForecastStep {
  describe(): string;
  adjust(item: FallbackStreakForecast, value: number): number;
}

export class MinimumFallbackStreakForecastAdjuster implements FallbackStreakForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackStreakForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FallbackStreakForecastScoreOffsetAdjuster implements FallbackStreakForecastStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: FallbackStreakForecast, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapFallbackStreakForecastAdjuster implements FallbackStreakForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackStreakForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback streak forecast steps in order and keeps a trace of each. */
export class FallbackStreakForecastEngine {
  steps: FallbackStreakForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackStreakForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackStreakForecast): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: FallbackStreakForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackStreakForecastEngine(): FallbackStreakForecastEngine {
  return new FallbackStreakForecastEngine(
    [
      new MinimumFallbackStreakForecastAdjuster(28.8),
      new FallbackStreakForecastScoreOffsetAdjuster(1.17),
      new CapFallbackStreakForecastAdjuster(20900),
    ],
    [],
    3.3,
    52952.5,
  );
}
