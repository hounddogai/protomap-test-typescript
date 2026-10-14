import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckForecast } from "./fraud-check-forecast.js";

/** One step of the fraud check forecast calculation. */
export interface FraudCheckForecastAdjuster {
  describe(): string;
  adjust(item: FraudCheckForecast, value: number): number;
}

export class TieredFraudCheckForecastAdjuster implements FraudCheckForecastAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFraudCheckForecastAdjuster implements FraudCheckForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFraudCheckForecastAdjuster implements FraudCheckForecastAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check forecast steps in order and keeps a trace of each. */
export class FraudCheckForecastEngine {
  steps: FraudCheckForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FraudCheckForecast): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FraudCheckForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFraudCheckForecastEngine(): FraudCheckForecastEngine {
  return new FraudCheckForecastEngine(
    [
      new TieredFraudCheckForecastAdjuster([1305, 6369, 9054], [0.99, 0.88, 0.84]),
      new RoundingFraudCheckForecastAdjuster(0.1),
      new PercentFraudCheckForecastAdjuster(-13.2),
    ],
    [],
    4.5,
    15644.4,
  );
}
