import * as numbers from "../../../../kit/numbers.js";
import { FallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

/** One step of the fallback double opt in budget calculation. */
export interface FallbackDoubleOptInBudgetModifier {
  describe(): string;
  adjust(item: FallbackDoubleOptInBudget, value: number): number;
}

export class PercentFallbackDoubleOptInBudgetAdjuster implements FallbackDoubleOptInBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackDoubleOptInBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackDoubleOptInBudgetAdjuster implements FallbackDoubleOptInBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackDoubleOptInBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameFallbackDoubleOptInBudgetAdjuster implements FallbackDoubleOptInBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackDoubleOptInBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFallbackDoubleOptInBudgetAdjuster implements FallbackDoubleOptInBudgetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackDoubleOptInBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback double opt in budget steps in order and keeps a trace of each. */
export class FallbackDoubleOptInBudgetEngine {
  steps: FallbackDoubleOptInBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackDoubleOptInBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackDoubleOptInBudget): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FallbackDoubleOptInBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackDoubleOptInBudgetEngine(): FallbackDoubleOptInBudgetEngine {
  return new FallbackDoubleOptInBudgetEngine(
    [
      new PercentFallbackDoubleOptInBudgetAdjuster(0.9),
      new TieredFallbackDoubleOptInBudgetAdjuster([1827, 6332], [0.87, 0.9]),
      new NameFallbackDoubleOptInBudgetAdjuster(new Map<string, number>([["south", 1.01]])),
      new RoundingFallbackDoubleOptInBudgetAdjuster(0.5),
    ],
    [],
    3.2,
    64578.9,
  );
}
