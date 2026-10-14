import * as numbers from "../../../../kit/numbers.js";
import { WindowBudget } from "./window-budget.js";

/** One step of the window budget calculation. */
export interface WindowBudgetStep {
  describe(): string;
  adjust(item: WindowBudget, value: number): number;
}

export class WindowBudgetRevisionOffsetAdjuster implements WindowBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: WindowBudget, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class RoundingWindowBudgetAdjuster implements WindowBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameWindowBudgetAdjuster implements WindowBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WindowBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapWindowBudgetAdjuster implements WindowBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWindowBudgetAdjuster implements WindowBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the window budget steps in order and keeps a trace of each. */
export class WindowBudgetEngine {
  steps: WindowBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowBudget): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: WindowBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowBudgetEngine(): WindowBudgetEngine {
  return new WindowBudgetEngine(
    [
      new WindowBudgetRevisionOffsetAdjuster(1.68),
      new RoundingWindowBudgetAdjuster(0.1),
      new NameWindowBudgetAdjuster(new Map<string, number>([["south", 1.26], ["online", 0.94]])),
      new CapWindowBudgetAdjuster(26357),
      new TieredWindowBudgetAdjuster([573, 607, 8301, 9847], [1.1, 1.16, 1.19, 1.13]),
    ],
    [],
    1,
    71378.9,
  );
}
