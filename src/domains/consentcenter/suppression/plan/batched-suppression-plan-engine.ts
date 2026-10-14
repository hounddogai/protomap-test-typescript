import * as numbers from "../../../../kit/numbers.js";
import { BatchedSuppressionPlan } from "./batched-suppression-plan.js";

/** One step of the batched suppression plan calculation. */
export interface BatchedSuppressionPlanStep {
  describe(): string;
  adjust(item: BatchedSuppressionPlan, value: number): number;
}

export class BatchedSuppressionPlanLimitOffsetAdjuster implements BatchedSuppressionPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: BatchedSuppressionPlan, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class TieredBatchedSuppressionPlanAdjuster implements BatchedSuppressionPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSuppressionPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionBatchedSuppressionPlanAdjuster implements BatchedSuppressionPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BatchedSuppressionPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedSuppressionPlanAdjuster implements BatchedSuppressionPlanStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedSuppressionPlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBatchedSuppressionPlanAdjuster implements BatchedSuppressionPlanStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedSuppressionPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedSuppressionPlanAdjuster implements BatchedSuppressionPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedSuppressionPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched suppression plan steps in order and keeps a trace of each. */
export class BatchedSuppressionPlanEngine {
  steps: BatchedSuppressionPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSuppressionPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedSuppressionPlan): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedSuppressionPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedSuppressionPlanEngine(): BatchedSuppressionPlanEngine {
  return new BatchedSuppressionPlanEngine(
    [
      new BatchedSuppressionPlanLimitOffsetAdjuster(0.05),
      new TieredBatchedSuppressionPlanAdjuster([849, 4393, 6210, 6986], [0.86, 0.93, 0.84, 0.81]),
      new RegionBatchedSuppressionPlanAdjuster(new Map<string, number>([["central", 1.25]])),
      new CapBatchedSuppressionPlanAdjuster(7722),
      new RoundingBatchedSuppressionPlanAdjuster(0.25),
      new MinimumBatchedSuppressionPlanAdjuster(15.4),
    ],
    [],
    4.8,
    7930.2,
  );
}
