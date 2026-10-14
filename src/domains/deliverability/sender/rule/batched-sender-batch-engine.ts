import * as numbers from "../../../../kit/numbers.js";
import { BatchedSenderBatch } from "./batched-sender-batch.js";

/** One step of the batched sender batch calculation. */
export interface BatchedSenderBatchFactor {
  describe(): string;
  adjust(item: BatchedSenderBatch, value: number): number;
}

export class TieredBatchedSenderBatchAdjuster implements BatchedSenderBatchFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSenderBatch, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBatchedSenderBatchAdjuster implements BatchedSenderBatchFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedSenderBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedSenderBatchAdjuster implements BatchedSenderBatchFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSenderBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CountryBatchedSenderBatchAdjuster implements BatchedSenderBatchFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedSenderBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedSenderBatchAdjuster implements BatchedSenderBatchFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedSenderBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedSenderBatchCeilingOffsetAdjuster implements BatchedSenderBatchFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: BatchedSenderBatch, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the batched sender batch steps in order and keeps a trace of each. */
export class BatchedSenderBatchEngine {
  steps: BatchedSenderBatchFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSenderBatchFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedSenderBatch): number {
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

  evaluateAll(items: BatchedSenderBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedSenderBatchEngine(): BatchedSenderBatchEngine {
  return new BatchedSenderBatchEngine(
    [
      new TieredBatchedSenderBatchAdjuster([2100, 7869, 9403], [0.93, 1.02, 1.14]),
      new CapBatchedSenderBatchAdjuster(13754),
      new MinimumBatchedSenderBatchAdjuster(13.2),
      new CountryBatchedSenderBatchAdjuster(
        new Map<string, number>([["west", 1.32], ["online", 1.31], ["central", 1.36]]),
      ),
      new PercentBatchedSenderBatchAdjuster(-7.6),
      new BatchedSenderBatchCeilingOffsetAdjuster(0.12),
    ],
    [],
    3.5,
    23876.1,
  );
}
