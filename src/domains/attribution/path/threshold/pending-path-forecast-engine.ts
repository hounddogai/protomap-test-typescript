import * as numbers from "../../../../kit/numbers.js";
import { PendingPathForecast } from "./pending-path-forecast.js";

/** One step of the pending path forecast calculation. */
export interface PendingPathForecastAdjuster {
  describe(): string;
  adjust(item: PendingPathForecast, value: number): number;
}

export class CapPendingPathForecastAdjuster implements PendingPathForecastAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPathForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPendingPathForecastAdjuster implements PendingPathForecastAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingPathForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelPendingPathForecastAdjuster implements PendingPathForecastAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingPathForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending path forecast steps in order and keeps a trace of each. */
export class PendingPathForecastEngine {
  steps: PendingPathForecastAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPathForecastAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingPathForecast): number {
    let current = item.projectedValue();
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

  evaluateAll(items: PendingPathForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingPathForecastEngine(): PendingPathForecastEngine {
  return new PendingPathForecastEngine(
    [
      new CapPendingPathForecastAdjuster(21020),
      new RoundingPendingPathForecastAdjuster(5),
      new LabelPendingPathForecastAdjuster(new Map<string, number>([["south", 0.84]])),
    ],
    [],
    1.6,
    22304.8,
  );
}
