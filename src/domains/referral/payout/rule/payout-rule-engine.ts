import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PayoutRule } from "./payout-rule.js";

/** One step of the payout rule calculation. */
export interface PayoutRuleAdjuster {
  describe(): string;
  adjust(item: PayoutRule, value: number): number;
}

export class MinimumPayoutRuleAdjuster implements PayoutRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PayoutRuleQuantityOffsetAdjuster implements PayoutRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: PayoutRule, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class LocalePayoutRuleAdjuster implements PayoutRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PayoutRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPayoutRuleAdjuster implements PayoutRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PayoutRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPayoutRuleAdjuster implements PayoutRuleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PayoutRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPayoutRuleAdjuster implements PayoutRuleAdjuster {
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

  adjust(item: PayoutRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout rule steps in order and keeps a trace of each. */
export class PayoutRuleEngine {
  steps: PayoutRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutRule): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PayoutRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutRuleEngine(flagsValue: flags.Registry): PayoutRuleEngine {
  return new PayoutRuleEngine(
    [
      new MinimumPayoutRuleAdjuster(26.6),
      new PayoutRuleQuantityOffsetAdjuster(1.17),
      new LocalePayoutRuleAdjuster(new Map<string, number>([["west", 1.28]])),
      new CapPayoutRuleAdjuster(7543),
      new RoundingPayoutRuleAdjuster(1),
      new FlaggedPayoutRuleAdjuster(flagsValue, "payout-rule-global", 6.7),
    ],
    [],
    3.1,
    48985.8,
  );
}
