import { PendingCohortBudget } from "./pending-cohort-budget.js";

/** One step of the pending cohort budget calculation. */
export interface PendingCohortBudgetFactor {
  describe(): string;
  adjust(item: PendingCohortBudget, value: number): number;
}

export class CapPendingCohortBudgetAdjuster implements PendingCohortBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingCohortBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingCohortBudgetAdjuster implements PendingCohortBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCohortBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPendingCohortBudgetAdjuster implements PendingCohortBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCohortBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingCohortBudgetAdjuster implements PendingCohortBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCohortBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending cohort budget steps in order and keeps a trace of each. */
export class PendingCohortBudgetEngine {
  steps: PendingCohortBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCohortBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingCohortBudget): number {
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

  evaluateAll(items: PendingCohortBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingCohortBudgetEngine(): PendingCohortBudgetEngine {
  return new PendingCohortBudgetEngine(
    [
      new CapPendingCohortBudgetAdjuster(49935),
      new TieredPendingCohortBudgetAdjuster([437, 5157, 5976, 7591], [1.05, 0.83, 1.04, 1.08]),
      new PercentPendingCohortBudgetAdjuster(-20.1),
      new MinimumPendingCohortBudgetAdjuster(14.1),
    ],
    [],
    2.7,
    93429.5,
  );
}
