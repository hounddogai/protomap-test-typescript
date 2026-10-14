import * as numbers from "../../../../kit/numbers.js";
import { BatchedCohortOverride } from "./batched-cohort-override.js";

/** One step of the batched cohort override calculation. */
export interface BatchedCohortOverrideStep {
  describe(): string;
  adjust(item: BatchedCohortOverride, value: number): number;
}

export class TieredBatchedCohortOverrideAdjuster implements BatchedCohortOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedCohortOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedCohortOverrideQuantityOffsetAdjuster implements BatchedCohortOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: BatchedCohortOverride, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumBatchedCohortOverrideAdjuster implements BatchedCohortOverrideStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCohortOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceBatchedCohortOverrideAdjuster implements BatchedCohortOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BatchedCohortOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched cohort override steps in order and keeps a trace of each. */
export class BatchedCohortOverrideEngine {
  steps: BatchedCohortOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCohortOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedCohortOverride): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedCohortOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedCohortOverrideEngine(): BatchedCohortOverrideEngine {
  return new BatchedCohortOverrideEngine(
    [
      new TieredBatchedCohortOverrideAdjuster([4853, 9697], [0.98, 0.87]),
      new BatchedCohortOverrideQuantityOffsetAdjuster(1.5),
      new MinimumBatchedCohortOverrideAdjuster(9.5),
      new UtmSourceBatchedCohortOverrideAdjuster(new Map<string, number>([["west", 0.75]])),
    ],
    [],
    2.6,
    61696.9,
  );
}
