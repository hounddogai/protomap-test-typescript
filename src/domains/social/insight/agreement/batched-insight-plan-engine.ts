import * as numbers from "../../../../kit/numbers.js";
import { BatchedInsightPlan } from "./batched-insight-plan.js";

/** One step of the batched insight plan calculation. */
export interface BatchedInsightPlanFactor {
  describe(): string;
  adjust(item: BatchedInsightPlan, value: number): number;
}

export class TieredBatchedInsightPlanAdjuster implements BatchedInsightPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedInsightPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleBatchedInsightPlanAdjuster implements BatchedInsightPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: BatchedInsightPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedInsightPlanAdjuster implements BatchedInsightPlanFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedInsightPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedInsightPlanAdjuster implements BatchedInsightPlanFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedInsightPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedInsightPlanLimitOffsetAdjuster implements BatchedInsightPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: BatchedInsightPlan, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the batched insight plan steps in order and keeps a trace of each. */
export class BatchedInsightPlanEngine {
  steps: BatchedInsightPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedInsightPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedInsightPlan): number {
    let current = item.netVolume();
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

  evaluateAll(items: BatchedInsightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedInsightPlanEngine(): BatchedInsightPlanEngine {
  return new BatchedInsightPlanEngine(
    [
      new TieredBatchedInsightPlanAdjuster([3003, 6565], [1.07, 0.95]),
      new LocaleBatchedInsightPlanAdjuster(
        new Map<string, number>([["retail", 1.23], ["north", 1.2], ["central", 0.86]]),
      ),
      new PercentBatchedInsightPlanAdjuster(15.8),
      new CapBatchedInsightPlanAdjuster(40518),
      new BatchedInsightPlanLimitOffsetAdjuster(1.64),
    ],
    [],
    1.4,
    28575.8,
  );
}
