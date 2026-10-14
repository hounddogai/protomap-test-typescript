import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingCsatRule } from "./rolling-csat-rule.js";

/** One step of the rolling csat rule calculation. */
export interface RollingCsatRuleStep {
  describe(): string;
  adjust(item: RollingCsatRule, value: number): number;
}

export class TieredRollingCsatRuleAdjuster implements RollingCsatRuleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingCsatRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRollingCsatRuleAdjuster implements RollingCsatRuleStep {
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

  adjust(item: RollingCsatRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingCsatRuleAdjuster implements RollingCsatRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingCsatRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingCsatRuleAdjuster implements RollingCsatRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingCsatRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRollingCsatRuleAdjuster implements RollingCsatRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingCsatRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the rolling csat rule steps in order and keeps a trace of each. */
export class RollingCsatRuleEngine {
  steps: RollingCsatRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingCsatRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingCsatRule): number {
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

  evaluateAll(items: RollingCsatRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingCsatRuleEngine(flagsValue: flags.Registry): RollingCsatRuleEngine {
  return new RollingCsatRuleEngine(
    [
      new TieredRollingCsatRuleAdjuster([1114, 4386, 6973], [0.84, 1.11, 0.92]),
      new FlaggedRollingCsatRuleAdjuster(flagsValue, "rolling-csat-rule-rolling", -5.4),
      new RoundingRollingCsatRuleAdjuster(5),
      new MinimumRollingCsatRuleAdjuster(49.3),
      new CapRollingCsatRuleAdjuster(36669),
    ],
    [],
    1.3,
    95118,
  );
}
