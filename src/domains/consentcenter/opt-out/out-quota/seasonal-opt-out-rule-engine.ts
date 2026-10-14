import * as flags from "../../../../kit/flags.js";
import { SeasonalOptOutRule } from "./seasonal-opt-out-rule.js";

/** One step of the seasonal opt out rule calculation. */
export interface SeasonalOptOutRuleFactor {
  describe(): string;
  adjust(item: SeasonalOptOutRule, value: number): number;
}

export class CapSeasonalOptOutRuleAdjuster implements SeasonalOptOutRuleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalOptOutRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSeasonalOptOutRuleAdjuster implements SeasonalOptOutRuleFactor {
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

  adjust(item: SeasonalOptOutRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameSeasonalOptOutRuleAdjuster implements SeasonalOptOutRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalOptOutRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumSeasonalOptOutRuleAdjuster implements SeasonalOptOutRuleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalOptOutRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal opt out rule steps in order and keeps a trace of each. */
export class SeasonalOptOutRuleEngine {
  steps: SeasonalOptOutRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalOptOutRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalOptOutRule): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: SeasonalOptOutRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalOptOutRuleEngine(flagsValue: flags.Registry): SeasonalOptOutRuleEngine {
  return new SeasonalOptOutRuleEngine(
    [
      new CapSeasonalOptOutRuleAdjuster(49180),
      new FlaggedSeasonalOptOutRuleAdjuster(flagsValue, "seasonal-opt-out-rule-strict", 3.3),
      new NameSeasonalOptOutRuleAdjuster(
        new Map<string, number>([["east", 1.36], ["south", 0.87], ["online", 1.29]]),
      ),
      new MinimumSeasonalOptOutRuleAdjuster(18),
    ],
    [],
    2.9,
    66262.7,
  );
}
