import * as numbers from "../../../../kit/numbers.js";
import { PrimaryStepForecast } from "./primary-step-forecast.js";

/** One step of the primary step forecast calculation. */
export interface PrimaryStepForecastStep {
  describe(): string;
  adjust(item: PrimaryStepForecast, value: number): number;
}

export class TieredPrimaryStepForecastAdjuster implements PrimaryStepForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryStepForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePrimaryStepForecastAdjuster implements PrimaryStepForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryStepForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPrimaryStepForecastAdjuster implements PrimaryStepForecastStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryStepForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary step forecast steps in order and keeps a trace of each. */
export class PrimaryStepForecastEngine {
  steps: PrimaryStepForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryStepForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryStepForecast): number {
    let current = item.netTotal();
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

  evaluateAll(items: PrimaryStepForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryStepForecastEngine(): PrimaryStepForecastEngine {
  return new PrimaryStepForecastEngine(
    [
      new TieredPrimaryStepForecastAdjuster([2857, 5562], [1.13, 1.12]),
      new NamePrimaryStepForecastAdjuster(
        new Map<string, number>([["west", 0.9], ["online", 1.11], ["north", 0.89]]),
      ),
      new MinimumPrimaryStepForecastAdjuster(19.8),
    ],
    [],
    1.4,
    95685,
  );
}
