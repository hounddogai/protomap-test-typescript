import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

/** One step of the adaptive deflection budget calculation. */
export interface AdaptiveDeflectionBudgetStep {
  describe(): string;
  adjust(item: AdaptiveDeflectionBudget, value: number): number;
}

export class MinimumAdaptiveDeflectionBudgetAdjuster implements AdaptiveDeflectionBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveDeflectionBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredAdaptiveDeflectionBudgetAdjuster implements AdaptiveDeflectionBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveDeflectionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveDeflectionBudgetAdjuster implements AdaptiveDeflectionBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveDeflectionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the adaptive deflection budget steps in order and keeps a trace of each. */
export class AdaptiveDeflectionBudgetEngine {
  steps: AdaptiveDeflectionBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveDeflectionBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveDeflectionBudget): number {
    let current = item.netVolume();
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

  evaluateAll(items: AdaptiveDeflectionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveDeflectionBudgetEngine(): AdaptiveDeflectionBudgetEngine {
  return new AdaptiveDeflectionBudgetEngine(
    [
      new MinimumAdaptiveDeflectionBudgetAdjuster(42.3),
      new TieredAdaptiveDeflectionBudgetAdjuster([1276, 1626], [0.8, 1.16]),
      new CapAdaptiveDeflectionBudgetAdjuster(49064),
    ],
    [],
    2.2,
    12489.5,
  );
}
