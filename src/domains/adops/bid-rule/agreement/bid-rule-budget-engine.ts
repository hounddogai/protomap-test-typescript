import * as numbers from "../../../../kit/numbers.js";
import { BidRuleBudget } from "./bid-rule-budget.js";

/** One step of the bid rule budget calculation. */
export interface BidRuleBudgetAdjuster {
  describe(): string;
  adjust(item: BidRuleBudget, value: number): number;
}

export class PercentBidRuleBudgetAdjuster implements BidRuleBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBidRuleBudgetAdjuster implements BidRuleBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BidRuleBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBidRuleBudgetAdjuster implements BidRuleBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BidRuleBudgetWindowDaysOffsetAdjuster implements BidRuleBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: BidRuleBudget, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the bid rule budget steps in order and keeps a trace of each. */
export class BidRuleBudgetEngine {
  steps: BidRuleBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BidRuleBudget): number {
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

  evaluateAll(items: BidRuleBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBidRuleBudgetEngine(): BidRuleBudgetEngine {
  return new BidRuleBudgetEngine(
    [
      new PercentBidRuleBudgetAdjuster(-5.2),
      new MinimumBidRuleBudgetAdjuster(37.6),
      new TieredBidRuleBudgetAdjuster([2354, 8972], [1.15, 1.12]),
      new BidRuleBudgetWindowDaysOffsetAdjuster(1.43),
    ],
    [],
    4.7,
    17499.1,
  );
}
