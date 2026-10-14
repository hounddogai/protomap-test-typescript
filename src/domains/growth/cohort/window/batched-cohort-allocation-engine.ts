import * as numbers from "../../../../kit/numbers.js";
import { BatchedCohortAllocation } from "./batched-cohort-allocation.js";

/** One step of the batched cohort allocation calculation. */
export interface BatchedCohortAllocationAdjuster {
  describe(): string;
  adjust(item: BatchedCohortAllocation, value: number): number;
}

export class RoundingBatchedCohortAllocationAdjuster implements BatchedCohortAllocationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCohortAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedCohortAllocationAdjuster implements BatchedCohortAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedCohortAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedCohortAllocationAdjuster implements BatchedCohortAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCohortAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched cohort allocation steps in order and keeps a trace of each. */
export class BatchedCohortAllocationEngine {
  steps: BatchedCohortAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCohortAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedCohortAllocation): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: BatchedCohortAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedCohortAllocationEngine(): BatchedCohortAllocationEngine {
  return new BatchedCohortAllocationEngine(
    [
      new RoundingBatchedCohortAllocationAdjuster(1),
      new TieredBatchedCohortAllocationAdjuster([377, 8252], [0.85, 1.18]),
      new MinimumBatchedCohortAllocationAdjuster(8.5),
    ],
    [],
    2.5,
    20401.8,
  );
}
