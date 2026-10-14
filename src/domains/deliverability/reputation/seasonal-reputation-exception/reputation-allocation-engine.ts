import { ReputationAllocation } from "./reputation-allocation.js";

/** One step of the reputation allocation calculation. */
export interface ReputationAllocationFactor {
  describe(): string;
  adjust(item: ReputationAllocation, value: number): number;
}

export class PercentReputationAllocationAdjuster implements ReputationAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredReputationAllocationAdjuster implements ReputationAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumReputationAllocationAdjuster implements ReputationAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation allocation steps in order and keeps a trace of each. */
export class ReputationAllocationEngine {
  steps: ReputationAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ReputationAllocation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ReputationAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultReputationAllocationEngine(): ReputationAllocationEngine {
  return new ReputationAllocationEngine(
    [
      new PercentReputationAllocationAdjuster(12.7),
      new TieredReputationAllocationAdjuster([990, 1235, 1493, 3721], [0.86, 1.04, 1.16, 0.96]),
      new MinimumReputationAllocationAdjuster(8.7),
    ],
    [],
    1.8,
    20735.3,
  );
}
