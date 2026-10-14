import * as numbers from "../../../../kit/numbers.js";
import { FallbackLevelBudget } from "./fallback-level-budget.js";

/** One step of the fallback level budget calculation. */
export interface FallbackLevelBudgetStep {
  describe(): string;
  adjust(item: FallbackLevelBudget, value: number): number;
}

export class MinimumFallbackLevelBudgetAdjuster implements FallbackLevelBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackLevelBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameFallbackLevelBudgetAdjuster implements FallbackLevelBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackLevelBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFallbackLevelBudgetAdjuster implements FallbackLevelBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackLevelBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingFallbackLevelBudgetAdjuster implements FallbackLevelBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackLevelBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FallbackLevelBudgetRatioOffsetAdjuster implements FallbackLevelBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: FallbackLevelBudget, value: number): number {
    return value + item.ratio * this.weight;
  }
}

/** Runs the fallback level budget steps in order and keeps a trace of each. */
export class FallbackLevelBudgetEngine {
  steps: FallbackLevelBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackLevelBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackLevelBudget): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: FallbackLevelBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackLevelBudgetEngine(): FallbackLevelBudgetEngine {
  return new FallbackLevelBudgetEngine(
    [
      new MinimumFallbackLevelBudgetAdjuster(16.2),
      new NameFallbackLevelBudgetAdjuster(
        new Map<string, number>([["north", 1.32], ["retail", 1.12], ["online", 0.73]]),
      ),
      new TieredFallbackLevelBudgetAdjuster([3755, 5159, 8282], [1.17, 0.83, 0.81]),
      new RoundingFallbackLevelBudgetAdjuster(0.05),
      new FallbackLevelBudgetRatioOffsetAdjuster(0.83),
    ],
    [],
    2,
    63751,
  );
}
