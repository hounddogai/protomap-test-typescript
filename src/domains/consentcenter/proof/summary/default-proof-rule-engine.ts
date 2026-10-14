import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultProofRule } from "./default-proof-rule.js";

/** One step of the default proof rule calculation. */
export interface DefaultProofRuleStep {
  describe(): string;
  adjust(item: DefaultProofRule, value: number): number;
}

export class FlaggedDefaultProofRuleAdjuster implements DefaultProofRuleStep {
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

  adjust(item: DefaultProofRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultProofRuleAdjuster implements DefaultProofRuleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultProofRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDefaultProofRuleAdjuster implements DefaultProofRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultProofRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultProofRuleBidOffsetAdjuster implements DefaultProofRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: DefaultProofRule, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class PercentDefaultProofRuleAdjuster implements DefaultProofRuleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultProofRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultProofRuleAdjuster implements DefaultProofRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultProofRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default proof rule steps in order and keeps a trace of each. */
export class DefaultProofRuleEngine {
  steps: DefaultProofRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultProofRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultProofRule): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: DefaultProofRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultProofRuleEngine(flagsValue: flags.Registry): DefaultProofRuleEngine {
  return new DefaultProofRuleEngine(
    [
      new FlaggedDefaultProofRuleAdjuster(flagsValue, "default-proof-rule-pending", -9.2),
      new TieredDefaultProofRuleAdjuster([3021, 3561], [0.84, 1.04]),
      new MinimumDefaultProofRuleAdjuster(4.2),
      new DefaultProofRuleBidOffsetAdjuster(1.96),
      new PercentDefaultProofRuleAdjuster(6.9),
      new RoundingDefaultProofRuleAdjuster(0.1),
    ],
    [],
    2.3,
    92516.5,
  );
}
