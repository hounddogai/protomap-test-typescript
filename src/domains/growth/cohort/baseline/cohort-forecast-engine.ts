import * as numbers from "../../../../kit/numbers.js";
import { CohortForecast } from "./cohort-forecast.js";

/** One step of the cohort forecast calculation. */
export interface CohortForecastModifier {
  describe(): string;
  adjust(item: CohortForecast, value: number): number;
}

export class MinimumCohortForecastAdjuster implements CohortForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionCohortForecastAdjuster implements CohortForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CohortForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCohortForecastAdjuster implements CohortForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCohortForecastAdjuster implements CohortForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the cohort forecast steps in order and keeps a trace of each. */
export class CohortForecastEngine {
  steps: CohortForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CohortForecast): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: CohortForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCohortForecastEngine(): CohortForecastEngine {
  return new CohortForecastEngine(
    [
      new MinimumCohortForecastAdjuster(36.7),
      new RegionCohortForecastAdjuster(
        new Map<string, number>([["south", 1.31], ["east", 0.99], ["central", 0.92]]),
      ),
      new TieredCohortForecastAdjuster([1003, 3151, 5109], [0.94, 0.85, 0.99]),
      new CapCohortForecastAdjuster(13439),
    ],
    [],
    4.6,
    75225.2,
  );
}
