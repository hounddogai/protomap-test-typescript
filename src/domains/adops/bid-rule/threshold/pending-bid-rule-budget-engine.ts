import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBidRuleBudget } from "./pending-bid-rule-budget.js";

/** One step of the pending bid rule budget calculation. */
export interface PendingBidRuleBudgetStep {
  describe(): string;
  adjust(item: PendingBidRuleBudget, value: number): number;
}

export class PercentPendingBidRuleBudgetAdjuster implements PendingBidRuleBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingBidRuleBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingBidRuleBudgetAdjuster implements PendingBidRuleBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingBidRuleBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingBidRuleBudgetAdjuster implements PendingBidRuleBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBidRuleBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingBidRuleBudgetAdjuster implements PendingBidRuleBudgetStep {
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

  adjust(item: PendingBidRuleBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingBidRuleBudgetDurationMinutesOffsetAdjuster implements PendingBidRuleBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: PendingBidRuleBudget, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class TieredPendingBidRuleBudgetAdjuster implements PendingBidRuleBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingBidRuleBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending bid rule budget steps in order and keeps a trace of each. */
export class PendingBidRuleBudgetEngine {
  steps: PendingBidRuleBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRuleBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBidRuleBudget): number {
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

  evaluateAll(items: PendingBidRuleBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBidRuleBudgetEngine(flagsValue: flags.Registry): PendingBidRuleBudgetEngine {
  return new PendingBidRuleBudgetEngine(
    [
      new PercentPendingBidRuleBudgetAdjuster(-3.7),
      new MinimumPendingBidRuleBudgetAdjuster(38.9),
      new RoundingPendingBidRuleBudgetAdjuster(5),
      new FlaggedPendingBidRuleBudgetAdjuster(flagsValue, "pending-bid-rule-budget-regional", -2.8),
      new PendingBidRuleBudgetDurationMinutesOffsetAdjuster(1.15),
      new TieredPendingBidRuleBudgetAdjuster([4684, 5301, 6854], [1.14, 1.16, 1.06]),
    ],
    [],
    1.4,
    53210.1,
  );
}
