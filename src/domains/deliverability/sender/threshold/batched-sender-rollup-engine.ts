import * as numbers from "../../../../kit/numbers.js";
import { BatchedSenderRollup } from "./batched-sender-rollup.js";

/** One step of the batched sender rollup calculation. */
export interface BatchedSenderRollupFactor {
  describe(): string;
  adjust(item: BatchedSenderRollup, value: number): number;
}

export class MinimumBatchedSenderRollupAdjuster implements BatchedSenderRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSenderRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedSenderRollupAdjuster implements BatchedSenderRollupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSenderRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBatchedSenderRollupAdjuster implements BatchedSenderRollupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedSenderRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedSenderRollupAdjuster implements BatchedSenderRollupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedSenderRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched sender rollup steps in order and keeps a trace of each. */
export class BatchedSenderRollupEngine {
  steps: BatchedSenderRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSenderRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedSenderRollup): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BatchedSenderRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedSenderRollupEngine(): BatchedSenderRollupEngine {
  return new BatchedSenderRollupEngine(
    [
      new MinimumBatchedSenderRollupAdjuster(40.1),
      new TieredBatchedSenderRollupAdjuster([983, 4723, 5228, 6944], [0.85, 0.94, 1.12, 1]),
      new PercentBatchedSenderRollupAdjuster(16.4),
      new RoundingBatchedSenderRollupAdjuster(0.05),
    ],
    [],
    2,
    67473.8,
  );
}
