import * as numbers from "../../../../kit/numbers.js";
import { TieredRetentionBudget } from "./tiered-retention-budget.js";

/** One step of the tiered retention budget calculation. */
export interface TieredRetentionBudgetFactor {
  describe(): string;
  adjust(item: TieredRetentionBudget, value: number): number;
}

export class TieredRetentionBudgetDiscountOffsetAdjuster implements TieredRetentionBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: TieredRetentionBudget, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class CapTieredRetentionBudgetAdjuster implements TieredRetentionBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredRetentionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredRetentionBudgetAdjuster implements TieredRetentionBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRetentionBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered retention budget steps in order and keeps a trace of each. */
export class TieredRetentionBudgetEngine {
  steps: TieredRetentionBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRetentionBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredRetentionBudget): number {
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

  evaluateAll(items: TieredRetentionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredRetentionBudgetEngine(): TieredRetentionBudgetEngine {
  return new TieredRetentionBudgetEngine(
    [
      new TieredRetentionBudgetDiscountOffsetAdjuster(1.19),
      new CapTieredRetentionBudgetAdjuster(2745),
      new MinimumTieredRetentionBudgetAdjuster(34.5),
    ],
    [],
    4.3,
    7273.8,
  );
}
