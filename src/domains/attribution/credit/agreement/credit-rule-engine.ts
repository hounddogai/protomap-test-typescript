import * as flags from "../../../../kit/flags.js";
import { CreditRule } from "./credit-rule.js";

/** One step of the credit rule calculation. */
export interface CreditRuleFactor {
  describe(): string;
  adjust(item: CreditRule, value: number): number;
}

export class FlaggedCreditRuleAdjuster implements CreditRuleFactor {
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

  adjust(item: CreditRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelCreditRuleAdjuster implements CreditRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CreditRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCreditRuleAdjuster implements CreditRuleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCreditRuleAdjuster implements CreditRuleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreditRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCreditRuleAdjuster implements CreditRuleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCreditRuleAdjuster implements CreditRuleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the credit rule steps in order and keeps a trace of each. */
export class CreditRuleEngine {
  steps: CreditRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CreditRule): number {
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

  evaluateAll(items: CreditRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCreditRuleEngine(flagsValue: flags.Registry): CreditRuleEngine {
  return new CreditRuleEngine(
    [
      new FlaggedCreditRuleAdjuster(flagsValue, "credit-rule-lenient", 4.1),
      new LabelCreditRuleAdjuster(new Map<string, number>([["retail", 0.92]])),
      new TieredCreditRuleAdjuster([5485, 9625], [0.94, 1.13]),
      new MinimumCreditRuleAdjuster(33.1),
      new CapCreditRuleAdjuster(43721),
      new PercentCreditRuleAdjuster(11.5),
    ],
    [],
    0.4,
    98811.7,
  );
}
