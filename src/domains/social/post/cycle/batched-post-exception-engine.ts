import * as numbers from "../../../../kit/numbers.js";
import { BatchedPostException } from "./batched-post-exception.js";

/** One step of the batched post exception calculation. */
export interface BatchedPostExceptionFactor {
  describe(): string;
  adjust(item: BatchedPostException, value: number): number;
}

export class UnitBatchedPostExceptionAdjuster implements BatchedPostExceptionFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BatchedPostException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedPostExceptionAdjuster implements BatchedPostExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPostException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedPostExceptionAdjuster implements BatchedPostExceptionFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedPostException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedPostExceptionAdjuster implements BatchedPostExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPostException, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the batched post exception steps in order and keeps a trace of each. */
export class BatchedPostExceptionEngine {
  steps: BatchedPostExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPostExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedPostException): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BatchedPostException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedPostExceptionEngine(): BatchedPostExceptionEngine {
  return new BatchedPostExceptionEngine(
    [
      new UnitBatchedPostExceptionAdjuster(new Map<string, number>([["east", 1.27]])),
      new PercentBatchedPostExceptionAdjuster(-15),
      new MinimumBatchedPostExceptionAdjuster(5.5),
      new CapBatchedPostExceptionAdjuster(47857),
    ],
    [],
    4.9,
    23766,
  );
}
