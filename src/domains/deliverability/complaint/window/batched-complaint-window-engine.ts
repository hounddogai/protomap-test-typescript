import { BatchedComplaintWindow } from "./batched-complaint-window.js";

/** One step of the batched complaint window calculation. */
export interface BatchedComplaintWindowStep {
  describe(): string;
  adjust(item: BatchedComplaintWindow, value: number): number;
}

export class CapBatchedComplaintWindowAdjuster implements BatchedComplaintWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedComplaintWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UnitBatchedComplaintWindowAdjuster implements BatchedComplaintWindowStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BatchedComplaintWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedComplaintWindowAdjuster implements BatchedComplaintWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedComplaintWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedComplaintWindowAdjuster implements BatchedComplaintWindowStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedComplaintWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched complaint window steps in order and keeps a trace of each. */
export class BatchedComplaintWindowEngine {
  steps: BatchedComplaintWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedComplaintWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedComplaintWindow): number {
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

  evaluateAll(items: BatchedComplaintWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedComplaintWindowEngine(): BatchedComplaintWindowEngine {
  return new BatchedComplaintWindowEngine(
    [
      new CapBatchedComplaintWindowAdjuster(4260),
      new UnitBatchedComplaintWindowAdjuster(
        new Map<string, number>([["north", 0.86], ["east", 1.27], ["online", 0.89]]),
      ),
      new TieredBatchedComplaintWindowAdjuster([2782, 4183, 4821], [0.95, 0.9, 1.09]),
      new MinimumBatchedComplaintWindowAdjuster(32.6),
    ],
    [],
    2.6,
    16379.1,
  );
}
