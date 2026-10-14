import { StrictLevelBudget } from "./strict-level-budget.js";

/** One step of the strict level budget calculation. */
export interface StrictLevelBudgetStep {
  describe(): string;
  adjust(item: StrictLevelBudget, value: number): number;
}

export class PercentStrictLevelBudgetAdjuster implements StrictLevelBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictLevelBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelStrictLevelBudgetAdjuster implements StrictLevelBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictLevelBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictLevelBudgetAdjuster implements StrictLevelBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictLevelBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStrictLevelBudgetAdjuster implements StrictLevelBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictLevelBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict level budget steps in order and keeps a trace of each. */
export class StrictLevelBudgetEngine {
  steps: StrictLevelBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictLevelBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictLevelBudget): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: StrictLevelBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictLevelBudgetEngine(): StrictLevelBudgetEngine {
  return new StrictLevelBudgetEngine(
    [
      new PercentStrictLevelBudgetAdjuster(-23.1),
      new LabelStrictLevelBudgetAdjuster(new Map<string, number>([["central", 1.23], ["retail", 0.96]])),
      new MinimumStrictLevelBudgetAdjuster(4.1),
      new TieredStrictLevelBudgetAdjuster([5543, 5610, 8166, 9587], [1.18, 0.9, 1.16, 1.12]),
    ],
    [],
    2.5,
    76539.1,
  );
}
