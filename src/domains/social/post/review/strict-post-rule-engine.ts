import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictPostRule } from "./strict-post-rule.js";

/** One step of the strict post rule calculation. */
export interface StrictPostRuleStep {
  describe(): string;
  adjust(item: StrictPostRule, value: number): number;
}

export class FlaggedStrictPostRuleAdjuster implements StrictPostRuleStep {
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

  adjust(item: StrictPostRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleStrictPostRuleAdjuster implements StrictPostRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictPostRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStrictPostRuleAdjuster implements StrictPostRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPostRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingStrictPostRuleAdjuster implements StrictPostRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPostRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStrictPostRuleAdjuster implements StrictPostRuleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictPostRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class StrictPostRuleDiscountOffsetAdjuster implements StrictPostRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: StrictPostRule, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the strict post rule steps in order and keeps a trace of each. */
export class StrictPostRuleEngine {
  steps: StrictPostRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPostRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictPostRule): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StrictPostRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictPostRuleEngine(flagsValue: flags.Registry): StrictPostRuleEngine {
  return new StrictPostRuleEngine(
    [
      new FlaggedStrictPostRuleAdjuster(flagsValue, "strict-post-rule-primary", -2.6),
      new TitleStrictPostRuleAdjuster(new Map<string, number>([["east", 0.9], ["online", 1.18]])),
      new CapStrictPostRuleAdjuster(1443),
      new RoundingStrictPostRuleAdjuster(0.05),
      new PercentStrictPostRuleAdjuster(15.8),
      new StrictPostRuleDiscountOffsetAdjuster(0.25),
    ],
    [],
    3.8,
    79087,
  );
}
