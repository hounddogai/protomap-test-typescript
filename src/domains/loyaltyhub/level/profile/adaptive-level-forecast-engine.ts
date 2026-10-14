import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveLevelForecast } from "./adaptive-level-forecast.js";

/** One step of the adaptive level forecast calculation. */
export interface AdaptiveLevelForecastAdjuster {
  describe(): string;
  adjust(item: AdaptiveLevelForecast, value: number): number;
}

export class RoundingAdaptiveLevelForecastAdjuster implements AdaptiveLevelForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveLevelForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveLevelForecastVersionOffsetAdjuster implements AdaptiveLevelForecastAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: AdaptiveLevelForecast, value: number): number {
    return value + item.version * this.weight;
  }
}

export class CapAdaptiveLevelForecastAdjuster implements AdaptiveLevelForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveLevelForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveLevelForecastAdjuster implements AdaptiveLevelForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveLevelForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive level forecast steps in order and keeps a trace of each. */
export class AdaptiveLevelForecastEngine {
  steps: AdaptiveLevelForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveLevelForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveLevelForecast): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: AdaptiveLevelForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveLevelForecastEngine(): AdaptiveLevelForecastEngine {
  return new AdaptiveLevelForecastEngine(
    [
      new RoundingAdaptiveLevelForecastAdjuster(0.5),
      new AdaptiveLevelForecastVersionOffsetAdjuster(1.57),
      new CapAdaptiveLevelForecastAdjuster(35158),
      new PercentAdaptiveLevelForecastAdjuster(-11.5),
    ],
    [],
    1,
    16129.3,
  );
}
