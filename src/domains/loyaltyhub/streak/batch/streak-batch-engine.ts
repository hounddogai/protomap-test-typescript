import * as numbers from "../../../../kit/numbers.js";
import { StreakBatch } from "./streak-batch.js";

/** One step of the streak batch calculation. */
export interface StreakBatchFactor {
  describe(): string;
  adjust(item: StreakBatch, value: number): number;
}

export class RoundingStreakBatchAdjuster implements StreakBatchFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StreakBatch, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredStreakBatchAdjuster implements StreakBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentStreakBatchAdjuster implements StreakBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelStreakBatchAdjuster implements StreakBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StreakBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StreakBatchRatioOffsetAdjuster implements StreakBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: StreakBatch, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapStreakBatchAdjuster implements StreakBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the streak batch steps in order and keeps a trace of each. */
export class StreakBatchEngine {
  steps: StreakBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StreakBatch): number {
    let current = item.netLoad();
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

  evaluateAll(items: StreakBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStreakBatchEngine(): StreakBatchEngine {
  return new StreakBatchEngine(
    [
      new RoundingStreakBatchAdjuster(0.05),
      new TieredStreakBatchAdjuster([1963, 3538, 6037, 8171], [1.15, 0.88, 0.89, 0.97]),
      new PercentStreakBatchAdjuster(13.9),
      new ChannelStreakBatchAdjuster(new Map<string, number>([["south", 1.3], ["online", 1.09]])),
      new StreakBatchRatioOffsetAdjuster(1.37),
      new CapStreakBatchAdjuster(36250),
    ],
    [],
    1.6,
    36345.6,
  );
}
