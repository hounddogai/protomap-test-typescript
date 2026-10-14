import * as numbers from "../../../../kit/numbers.js";
import { PendingStreakBudget } from "./pending-streak-budget.js";

/** One step of the pending streak budget calculation. */
export interface PendingStreakBudgetAdjuster {
  describe(): string;
  adjust(item: PendingStreakBudget, value: number): number;
}

export class PercentPendingStreakBudgetAdjuster implements PendingStreakBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingStreakBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingStreakBudgetMarginOffsetAdjuster implements PendingStreakBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PendingStreakBudget, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class TieredPendingStreakBudgetAdjuster implements PendingStreakBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingStreakBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending streak budget steps in order and keeps a trace of each. */
export class PendingStreakBudgetEngine {
  steps: PendingStreakBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingStreakBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingStreakBudget): number {
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

  evaluateAll(items: PendingStreakBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingStreakBudgetEngine(): PendingStreakBudgetEngine {
  return new PendingStreakBudgetEngine(
    [
      new PercentPendingStreakBudgetAdjuster(-6.2),
      new PendingStreakBudgetMarginOffsetAdjuster(0.75),
      new TieredPendingStreakBudgetAdjuster([1645, 5571], [1.2, 0.92]),
    ],
    [],
    1.1,
    24082.1,
  );
}
