import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPathEstimate } from "./scheduled-path-estimate.js";

/** One step of the scheduled path estimate calculation. */
export interface ScheduledPathEstimateFactor {
  describe(): string;
  adjust(item: ScheduledPathEstimate, value: number): number;
}

export class RoundingScheduledPathEstimateAdjuster implements ScheduledPathEstimateFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledPathEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledPathEstimateAdjuster implements ScheduledPathEstimateFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledPathEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapScheduledPathEstimateAdjuster implements ScheduledPathEstimateFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPathEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled path estimate steps in order and keeps a trace of each. */
export class ScheduledPathEstimateEngine {
  steps: ScheduledPathEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPathEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledPathEstimate): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ScheduledPathEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledPathEstimateEngine(): ScheduledPathEstimateEngine {
  return new ScheduledPathEstimateEngine(
    [
      new RoundingScheduledPathEstimateAdjuster(5),
      new TieredScheduledPathEstimateAdjuster([181, 403, 6181, 7134], [0.84, 0.98, 0.96, 1.01]),
      new CapScheduledPathEstimateAdjuster(22634),
    ],
    [],
    4.6,
    64310.3,
  );
}
