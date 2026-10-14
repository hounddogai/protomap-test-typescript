import { BatchedOptOutPlan } from "./batched-opt-out-plan.js";

/** One step of the batched opt out plan calculation. */
export interface BatchedOptOutPlanStep {
  describe(): string;
  adjust(item: BatchedOptOutPlan, value: number): number;
}

export class MinimumBatchedOptOutPlanAdjuster implements BatchedOptOutPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedOptOutPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedOptOutPlanAdjuster implements BatchedOptOutPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedOptOutPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceBatchedOptOutPlanAdjuster implements BatchedOptOutPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: BatchedOptOutPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedOptOutPlanAdjuster implements BatchedOptOutPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedOptOutPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched opt out plan steps in order and keeps a trace of each. */
export class BatchedOptOutPlanEngine {
  steps: BatchedOptOutPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedOptOutPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedOptOutPlan): number {
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

  evaluateAll(items: BatchedOptOutPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedOptOutPlanEngine(): BatchedOptOutPlanEngine {
  return new BatchedOptOutPlanEngine(
    [
      new MinimumBatchedOptOutPlanAdjuster(44.3),
      new TieredBatchedOptOutPlanAdjuster([3698, 6530, 6666], [0.85, 0.94, 1.05]),
      new SourceBatchedOptOutPlanAdjuster(
        new Map<string, number>([["online", 0.81], ["east", 0.83], ["south", 0.75]]),
      ),
      new PercentBatchedOptOutPlanAdjuster(-5.6),
    ],
    [],
    3.3,
    32031,
  );
}
