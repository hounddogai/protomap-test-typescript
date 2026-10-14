import * as flags from "../../../../kit/flags.js";
import { PayoutBudget } from "./payout-budget.js";

/** One step of the payout budget calculation. */
export interface PayoutBudgetModifier {
  describe(): string;
  adjust(item: PayoutBudget, value: number): number;
}

export class FlaggedPayoutBudgetAdjuster implements PayoutBudgetModifier {
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

  adjust(item: PayoutBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPayoutBudgetAdjuster implements PayoutBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPayoutBudgetAdjuster implements PayoutBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionPayoutBudgetAdjuster implements PayoutBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PayoutBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPayoutBudgetAdjuster implements PayoutBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the payout budget steps in order and keeps a trace of each. */
export class PayoutBudgetEngine {
  steps: PayoutBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PayoutBudget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PayoutBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPayoutBudgetEngine(flagsValue: flags.Registry): PayoutBudgetEngine {
  return new PayoutBudgetEngine(
    [
      new FlaggedPayoutBudgetAdjuster(flagsValue, "payout-budget-fallback", -4.7),
      new TieredPayoutBudgetAdjuster([2526, 3717, 5484], [0.95, 1.13, 0.91]),
      new PercentPayoutBudgetAdjuster(-4.6),
      new RegionPayoutBudgetAdjuster(new Map<string, number>([["online", 0.86]])),
      new CapPayoutBudgetAdjuster(22386),
    ],
    [],
    2.4,
    93478.7,
  );
}
