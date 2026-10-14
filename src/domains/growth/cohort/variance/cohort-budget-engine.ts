import { CohortBudget } from "./cohort-budget.js";

/** One step of the cohort budget calculation. */
export interface CohortBudgetAdjuster {
  describe(): string;
  adjust(item: CohortBudget, value: number): number;
}

export class SourceCohortBudgetAdjuster implements CohortBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: CohortBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCohortBudgetAdjuster implements CohortBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCohortBudgetAdjuster implements CohortBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CohortBudgetSendAtOffsetAdjuster implements CohortBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: CohortBudget, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class MinimumCohortBudgetAdjuster implements CohortBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the cohort budget steps in order and keeps a trace of each. */
export class CohortBudgetEngine {
  steps: CohortBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortBudget): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CohortBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortBudgetEngine(): CohortBudgetEngine {
  return new CohortBudgetEngine(
    [
      new SourceCohortBudgetAdjuster(
        new Map<string, number>([["online", 0.8], ["south", 0.72], ["east", 1.11]]),
      ),
      new PercentCohortBudgetAdjuster(2.4),
      new TieredCohortBudgetAdjuster([1270, 4102, 4230, 6472], [1.08, 1.17, 1.01, 1.04]),
      new CohortBudgetSendAtOffsetAdjuster(0.75),
      new MinimumCohortBudgetAdjuster(5.5),
    ],
    [],
    3,
    83915.9,
  );
}
