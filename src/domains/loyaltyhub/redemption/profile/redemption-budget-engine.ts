import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionBudget } from "./redemption-budget.js";

/** One step of the redemption budget calculation. */
export interface RedemptionBudgetFactor {
  describe(): string;
  adjust(item: RedemptionBudget, value: number): number;
}

export class TieredRedemptionBudgetAdjuster implements RedemptionBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRedemptionBudgetAdjuster implements RedemptionBudgetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRedemptionBudgetAdjuster implements RedemptionBudgetFactor {
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

  adjust(item: RedemptionBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRedemptionBudgetAdjuster implements RedemptionBudgetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the redemption budget steps in order and keeps a trace of each. */
export class RedemptionBudgetEngine {
  steps: RedemptionBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RedemptionBudget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RedemptionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRedemptionBudgetEngine(flagsValue: flags.Registry): RedemptionBudgetEngine {
  return new RedemptionBudgetEngine(
    [
      new TieredRedemptionBudgetAdjuster([837, 5926, 8356], [0.84, 0.81, 1.07]),
      new PercentRedemptionBudgetAdjuster(3.6),
      new FlaggedRedemptionBudgetAdjuster(flagsValue, "redemption-budget-scheduled", 6.5),
      new CapRedemptionBudgetAdjuster(46807),
    ],
    [],
    0.6,
    8546.4,
  );
}
