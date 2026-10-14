import { DefaultDeflectionBudget } from "./default-deflection-budget.js";

/** One step of the default deflection budget calculation. */
export interface DefaultDeflectionBudgetAdjuster {
  describe(): string;
  adjust(item: DefaultDeflectionBudget, value: number): number;
}

export class TieredDefaultDeflectionBudgetAdjuster implements DefaultDeflectionBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultDeflectionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDefaultDeflectionBudgetAdjuster implements DefaultDeflectionBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultDeflectionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultDeflectionBudgetAdjuster implements DefaultDeflectionBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultDeflectionBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapDefaultDeflectionBudgetAdjuster implements DefaultDeflectionBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultDeflectionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default deflection budget steps in order and keeps a trace of each. */
export class DefaultDeflectionBudgetEngine {
  steps: DefaultDeflectionBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultDeflectionBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultDeflectionBudget): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: DefaultDeflectionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultDeflectionBudgetEngine(): DefaultDeflectionBudgetEngine {
  return new DefaultDeflectionBudgetEngine(
    [
      new TieredDefaultDeflectionBudgetAdjuster([3626, 7354], [1.11, 1.19]),
      new PercentDefaultDeflectionBudgetAdjuster(-14.8),
      new MinimumDefaultDeflectionBudgetAdjuster(34.9),
      new CapDefaultDeflectionBudgetAdjuster(42411),
    ],
    [],
    2.5,
    96862.6,
  );
}
