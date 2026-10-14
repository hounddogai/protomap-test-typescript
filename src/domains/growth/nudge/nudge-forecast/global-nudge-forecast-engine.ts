import * as numbers from "../../../../kit/numbers.js";
import { GlobalNudgeForecast } from "./global-nudge-forecast.js";

/** One step of the global nudge forecast calculation. */
export interface GlobalNudgeForecastFactor {
  describe(): string;
  adjust(item: GlobalNudgeForecast, value: number): number;
}

export class RoundingGlobalNudgeForecastAdjuster implements GlobalNudgeForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalNudgeForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class GlobalNudgeForecastScoreOffsetAdjuster implements GlobalNudgeForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: GlobalNudgeForecast, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TieredGlobalNudgeForecastAdjuster implements GlobalNudgeForecastFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalNudgeForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global nudge forecast steps in order and keeps a trace of each. */
export class GlobalNudgeForecastEngine {
  steps: GlobalNudgeForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalNudgeForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalNudgeForecast): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: GlobalNudgeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalNudgeForecastEngine(): GlobalNudgeForecastEngine {
  return new GlobalNudgeForecastEngine(
    [
      new RoundingGlobalNudgeForecastAdjuster(0.1),
      new GlobalNudgeForecastScoreOffsetAdjuster(1.42),
      new TieredGlobalNudgeForecastAdjuster([1497, 9622], [0.96, 0.92]),
    ],
    [],
    3,
    87957.5,
  );
}
