import * as numbers from "../../../../kit/numbers.js";
import { LenientStreakBudget } from "./lenient-streak-budget.js";

/** One step of the lenient streak budget calculation. */
export interface LenientStreakBudgetAdjuster {
  describe(): string;
  adjust(item: LenientStreakBudget, value: number): number;
}

export class LenientStreakBudgetPriorityOffsetAdjuster implements LenientStreakBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: LenientStreakBudget, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class PercentLenientStreakBudgetAdjuster implements LenientStreakBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientStreakBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientStreakBudgetAdjuster implements LenientStreakBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientStreakBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelLenientStreakBudgetAdjuster implements LenientStreakBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientStreakBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient streak budget steps in order and keeps a trace of each. */
export class LenientStreakBudgetEngine {
  steps: LenientStreakBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientStreakBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientStreakBudget): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LenientStreakBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientStreakBudgetEngine(): LenientStreakBudgetEngine {
  return new LenientStreakBudgetEngine(
    [
      new LenientStreakBudgetPriorityOffsetAdjuster(1.45),
      new PercentLenientStreakBudgetAdjuster(-23.7),
      new TieredLenientStreakBudgetAdjuster([999, 2636, 9555], [1.16, 1.13, 1.14]),
      new ChannelLenientStreakBudgetAdjuster(new Map<string, number>([["online", 1.1], ["retail", 1.04]])),
    ],
    [],
    4.8,
    70779.6,
  );
}
