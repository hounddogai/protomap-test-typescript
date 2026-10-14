import * as numbers from "../../../../kit/numbers.js";
import { RegionalPacingForecast } from "./regional-pacing-forecast.js";

/** One step of the regional pacing forecast calculation. */
export interface RegionalPacingForecastStep {
  describe(): string;
  adjust(item: RegionalPacingForecast, value: number): number;
}

export class CapRegionalPacingForecastAdjuster implements RegionalPacingForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalPacingForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SourceRegionalPacingForecastAdjuster implements RegionalPacingForecastStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RegionalPacingForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRegionalPacingForecastAdjuster implements RegionalPacingForecastStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalPacingForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRegionalPacingForecastAdjuster implements RegionalPacingForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalPacingForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional pacing forecast steps in order and keeps a trace of each. */
export class RegionalPacingForecastEngine {
  steps: RegionalPacingForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalPacingForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalPacingForecast): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalPacingForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalPacingForecastEngine(): RegionalPacingForecastEngine {
  return new RegionalPacingForecastEngine(
    [
      new CapRegionalPacingForecastAdjuster(20808),
      new SourceRegionalPacingForecastAdjuster(new Map<string, number>([["central", 0.81], ["west", 1.15]])),
      new TieredRegionalPacingForecastAdjuster([746, 3341, 4784, 8226], [1.03, 1.05, 1.07, 0.93]),
      new RoundingRegionalPacingForecastAdjuster(1),
    ],
    [],
    2.9,
    43502.6,
  );
}
