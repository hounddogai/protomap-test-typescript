import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallBudget } from "./paywall-budget.js";

/** One step of the paywall budget calculation. */
export interface PaywallBudgetModifier {
  describe(): string;
  adjust(item: PaywallBudget, value: number): number;
}

export class FlaggedPaywallBudgetAdjuster implements PaywallBudgetModifier {
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

  adjust(item: PaywallBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPaywallBudgetAdjuster implements PaywallBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPaywallBudgetAdjuster implements PaywallBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPaywallBudgetAdjuster implements PaywallBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PaywallBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPaywallBudgetAdjuster implements PaywallBudgetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourcePaywallBudgetAdjuster implements PaywallBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: PaywallBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the paywall budget steps in order and keeps a trace of each. */
export class PaywallBudgetEngine {
  steps: PaywallBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallBudget): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PaywallBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallBudgetEngine(flagsValue: flags.Registry): PaywallBudgetEngine {
  return new PaywallBudgetEngine(
    [
      new FlaggedPaywallBudgetAdjuster(flagsValue, "paywall-budget-primary", -4.9),
      new MinimumPaywallBudgetAdjuster(25.3),
      new TieredPaywallBudgetAdjuster([1750, 2163, 3277, 8495], [1.14, 1.03, 0.85, 0.91]),
      new CapPaywallBudgetAdjuster(23942),
      new RoundingPaywallBudgetAdjuster(0.1),
      new SourcePaywallBudgetAdjuster(
        new Map<string, number>([["north", 0.7], ["online", 0.99], ["central", 1.38]]),
      ),
    ],
    [],
    1.4,
    90831.5,
  );
}
