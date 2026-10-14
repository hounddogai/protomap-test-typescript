import * as numbers from "../../../../kit/numbers.js";
import { PendingSuppressionForecast } from "./pending-suppression-forecast.js";

/** One step of the pending suppression forecast calculation. */
export interface PendingSuppressionForecastFactor {
  describe(): string;
  adjust(item: PendingSuppressionForecast, value: number): number;
}

export class RoundingPendingSuppressionForecastAdjuster implements PendingSuppressionForecastFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingSuppressionForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingSuppressionForecastCeilingOffsetAdjuster implements PendingSuppressionForecastFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingSuppressionForecast, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumPendingSuppressionForecastAdjuster implements PendingSuppressionForecastFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSuppressionForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending suppression forecast steps in order and keeps a trace of each. */
export class PendingSuppressionForecastEngine {
  steps: PendingSuppressionForecastFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSuppressionForecastFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingSuppressionForecast): number {
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

  evaluateAll(items: PendingSuppressionForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingSuppressionForecastEngine(): PendingSuppressionForecastEngine {
  return new PendingSuppressionForecastEngine(
    [
      new RoundingPendingSuppressionForecastAdjuster(0.05),
      new PendingSuppressionForecastCeilingOffsetAdjuster(0.85),
      new MinimumPendingSuppressionForecastAdjuster(37.4),
    ],
    [],
    4.5,
    39950.2,
  );
}
