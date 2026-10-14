import * as flags from "../../../../kit/flags.js";
import { BatchedPlacementBudget } from "./batched-placement-budget.js";

/** One step of the batched placement budget calculation. */
export interface BatchedPlacementBudgetAdjuster {
  describe(): string;
  adjust(item: BatchedPlacementBudget, value: number): number;
}

export class NameBatchedPlacementBudgetAdjuster implements BatchedPlacementBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BatchedPlacementBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapBatchedPlacementBudgetAdjuster implements BatchedPlacementBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedPlacementBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBatchedPlacementBudgetAdjuster implements BatchedPlacementBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedPlacementBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBatchedPlacementBudgetAdjuster implements BatchedPlacementBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedPlacementBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BatchedPlacementBudgetSequenceOffsetAdjuster implements BatchedPlacementBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: BatchedPlacementBudget, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class FlaggedBatchedPlacementBudgetAdjuster implements BatchedPlacementBudgetAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedPlacementBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched placement budget steps in order and keeps a trace of each. */
export class BatchedPlacementBudgetEngine {
  steps: BatchedPlacementBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedPlacementBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedPlacementBudget): number {
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

  evaluateAll(items: BatchedPlacementBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedPlacementBudgetEngine(flagsValue: flags.Registry): BatchedPlacementBudgetEngine {
  return new BatchedPlacementBudgetEngine(
    [
      new NameBatchedPlacementBudgetAdjuster(new Map<string, number>([["west", 1.13]])),
      new CapBatchedPlacementBudgetAdjuster(44499),
      new TieredBatchedPlacementBudgetAdjuster([1719, 2579, 6704], [1.19, 1.01, 0.93]),
      new PercentBatchedPlacementBudgetAdjuster(-9.3),
      new BatchedPlacementBudgetSequenceOffsetAdjuster(1.45),
      new FlaggedBatchedPlacementBudgetAdjuster(flagsValue, "batched-placement-budget-adaptive", 6.3),
    ],
    [],
    0.5,
    55553.7,
  );
}
