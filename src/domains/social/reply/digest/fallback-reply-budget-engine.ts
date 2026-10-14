import * as numbers from "../../../../kit/numbers.js";
import { FallbackReplyBudget } from "./fallback-reply-budget.js";

/** One step of the fallback reply budget calculation. */
export interface FallbackReplyBudgetStep {
  describe(): string;
  adjust(item: FallbackReplyBudget, value: number): number;
}

export class FallbackReplyBudgetStartsAtOffsetAdjuster implements FallbackReplyBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: FallbackReplyBudget, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class TieredFallbackReplyBudgetAdjuster implements FallbackReplyBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackReplyBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackReplyBudgetAdjuster implements FallbackReplyBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackReplyBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback reply budget steps in order and keeps a trace of each. */
export class FallbackReplyBudgetEngine {
  steps: FallbackReplyBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackReplyBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackReplyBudget): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FallbackReplyBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackReplyBudgetEngine(): FallbackReplyBudgetEngine {
  return new FallbackReplyBudgetEngine(
    [
      new FallbackReplyBudgetStartsAtOffsetAdjuster(1.27),
      new TieredFallbackReplyBudgetAdjuster([730, 5849, 7099, 9858], [0.97, 0.97, 0.91, 0.99]),
      new CapFallbackReplyBudgetAdjuster(7217),
    ],
    [],
    4.9,
    39934.1,
  );
}
