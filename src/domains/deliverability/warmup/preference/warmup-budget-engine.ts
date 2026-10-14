import { WarmupBudget } from "./warmup-budget.js";

/** One step of the warmup budget calculation. */
export interface WarmupBudgetAdjuster {
  describe(): string;
  adjust(item: WarmupBudget, value: number): number;
}

export class MinimumWarmupBudgetAdjuster implements WarmupBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWarmupBudgetAdjuster implements WarmupBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WarmupBudgetRevisionOffsetAdjuster implements WarmupBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: WarmupBudget, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class TieredWarmupBudgetAdjuster implements WarmupBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the warmup budget steps in order and keeps a trace of each. */
export class WarmupBudgetEngine {
  steps: WarmupBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WarmupBudget): number {
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

  evaluateAll(items: WarmupBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWarmupBudgetEngine(): WarmupBudgetEngine {
  return new WarmupBudgetEngine(
    [
      new MinimumWarmupBudgetAdjuster(2.3),
      new PercentWarmupBudgetAdjuster(-19.9),
      new WarmupBudgetRevisionOffsetAdjuster(1.69),
      new TieredWarmupBudgetAdjuster([893, 4989], [1.11, 1.19]),
    ],
    [],
    1.6,
    92902.9,
  );
}
