import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFlightVariance } from "./batched-flight-variance.js";

/** One step of the batched flight variance calculation. */
export interface BatchedFlightVarianceStep {
  describe(): string;
  adjust(item: BatchedFlightVariance, value: number): number;
}

export class TieredBatchedFlightVarianceAdjuster implements BatchedFlightVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedFlightVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBatchedFlightVarianceAdjuster implements BatchedFlightVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFlightVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentBatchedFlightVarianceAdjuster implements BatchedFlightVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedFlightVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedFlightVarianceAdjuster implements BatchedFlightVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFlightVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedFlightVarianceAdjuster implements BatchedFlightVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedFlightVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBatchedFlightVarianceAdjuster implements BatchedFlightVarianceStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedFlightVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched flight variance steps in order and keeps a trace of each. */
export class BatchedFlightVarianceEngine {
  steps: BatchedFlightVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFlightVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedFlightVariance): number {
    let current = item.netValue();
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

  evaluateAll(items: BatchedFlightVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedFlightVarianceEngine(flagsValue: flags.Registry): BatchedFlightVarianceEngine {
  return new BatchedFlightVarianceEngine(
    [
      new TieredBatchedFlightVarianceAdjuster([4011, 7555, 9546], [1.01, 0.97, 0.86]),
      new RoundingBatchedFlightVarianceAdjuster(0.1),
      new PercentBatchedFlightVarianceAdjuster(7.1),
      new MinimumBatchedFlightVarianceAdjuster(24),
      new CapBatchedFlightVarianceAdjuster(13329),
      new FlaggedBatchedFlightVarianceAdjuster(flagsValue, "batched-flight-variance-legacy", 6.1),
    ],
    [],
    1.9,
    37658.4,
  );
}
