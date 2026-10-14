import * as numbers from "../../../../kit/numbers.js";
import { OptOutForecast } from "./opt-out-forecast.js";

/** One step of the opt out forecast calculation. */
export interface OptOutForecastFactor {
  describe(): string;
  adjust(item: OptOutForecast, value: number): number;
}

export class LabelOptOutForecastAdjuster implements OptOutForecastFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: OptOutForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingOptOutForecastAdjuster implements OptOutForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class OptOutForecastCapacityOffsetAdjuster implements OptOutForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: OptOutForecast, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class MinimumOptOutForecastAdjuster implements OptOutForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentOptOutForecastAdjuster implements OptOutForecastFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out forecast steps in order and keeps a trace of each. */
export class OptOutForecastEngine {
  steps: OptOutForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutForecast): number {
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

  evaluateAll(items: OptOutForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutForecastEngine(): OptOutForecastEngine {
  return new OptOutForecastEngine(
    [
      new LabelOptOutForecastAdjuster(new Map<string, number>([["north", 1.07], ["west", 1.14]])),
      new RoundingOptOutForecastAdjuster(5),
      new OptOutForecastCapacityOffsetAdjuster(0.17),
      new MinimumOptOutForecastAdjuster(23.8),
      new PercentOptOutForecastAdjuster(-3.2),
    ],
    [],
    5,
    54643.7,
  );
}
