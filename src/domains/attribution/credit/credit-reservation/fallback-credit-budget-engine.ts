import * as flags from "../../../../kit/flags.js";
import { FallbackCreditBudget } from "./fallback-credit-budget.js";

/** One step of the fallback credit budget calculation. */
export interface FallbackCreditBudgetAdjuster {
  describe(): string;
  adjust(item: FallbackCreditBudget, value: number): number;
}

export class CapFallbackCreditBudgetAdjuster implements FallbackCreditBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackCreditBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackCreditBudgetAdjuster implements FallbackCreditBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackCreditBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumFallbackCreditBudgetAdjuster implements FallbackCreditBudgetAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackCreditBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelFallbackCreditBudgetAdjuster implements FallbackCreditBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackCreditBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackCreditBudgetRatioOffsetAdjuster implements FallbackCreditBudgetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: FallbackCreditBudget, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class FlaggedFallbackCreditBudgetAdjuster implements FallbackCreditBudgetAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: FallbackCreditBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback credit budget steps in order and keeps a trace of each. */
export class FallbackCreditBudgetEngine {
  steps: FallbackCreditBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackCreditBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackCreditBudget): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: FallbackCreditBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackCreditBudgetEngine(flagsValue: flags.Registry): FallbackCreditBudgetEngine {
  return new FallbackCreditBudgetEngine(
    [
      new CapFallbackCreditBudgetAdjuster(25767),
      new TieredFallbackCreditBudgetAdjuster([6353, 9546], [0.89, 0.81]),
      new MinimumFallbackCreditBudgetAdjuster(5.4),
      new LabelFallbackCreditBudgetAdjuster(new Map<string, number>([["north", 0.75]])),
      new FallbackCreditBudgetRatioOffsetAdjuster(1.45),
      new FlaggedFallbackCreditBudgetAdjuster(flagsValue, "fallback-credit-budget-scheduled", 8.5),
    ],
    [],
    4.7,
    34086.6,
  );
}
