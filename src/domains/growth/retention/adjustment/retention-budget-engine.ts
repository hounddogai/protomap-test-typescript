import { RetentionBudget } from "./retention-budget.js";

/** One step of the retention budget calculation. */
export interface RetentionBudgetFactor {
  describe(): string;
  adjust(item: RetentionBudget, value: number): number;
}

export class TitleRetentionBudgetAdjuster implements RetentionBudgetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RetentionBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRetentionBudgetAdjuster implements RetentionBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RetentionBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRetentionBudgetAdjuster implements RetentionBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RetentionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRetentionBudgetAdjuster implements RetentionBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the retention budget steps in order and keeps a trace of each. */
export class RetentionBudgetEngine {
  steps: RetentionBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionBudget): number {
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

  evaluateAll(items: RetentionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionBudgetEngine(): RetentionBudgetEngine {
  return new RetentionBudgetEngine(
    [
      new TitleRetentionBudgetAdjuster(new Map<string, number>([["retail", 0.82], ["north", 1.05]])),
      new MinimumRetentionBudgetAdjuster(35.7),
      new TieredRetentionBudgetAdjuster([5778, 7508, 8090, 9182], [0.89, 1.15, 0.81, 1.11]),
      new PercentRetentionBudgetAdjuster(-17.7),
    ],
    [],
    1.1,
    66716.3,
  );
}
