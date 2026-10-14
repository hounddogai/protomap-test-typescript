import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackOptOutRule } from "./fallback-opt-out-rule.js";

/** One step of the fallback opt out rule calculation. */
export interface FallbackOptOutRuleStep {
  describe(): string;
  adjust(item: FallbackOptOutRule, value: number): number;
}

export class MinimumFallbackOptOutRuleAdjuster implements FallbackOptOutRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackOptOutRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelFallbackOptOutRuleAdjuster implements FallbackOptOutRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackOptOutRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackOptOutRuleAdjuster implements FallbackOptOutRuleStep {
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

  adjust(item: FallbackOptOutRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackOptOutRuleAdjuster implements FallbackOptOutRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackOptOutRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingFallbackOptOutRuleAdjuster implements FallbackOptOutRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackOptOutRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentFallbackOptOutRuleAdjuster implements FallbackOptOutRuleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackOptOutRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback opt out rule steps in order and keeps a trace of each. */
export class FallbackOptOutRuleEngine {
  steps: FallbackOptOutRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackOptOutRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackOptOutRule): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FallbackOptOutRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackOptOutRuleEngine(flagsValue: flags.Registry): FallbackOptOutRuleEngine {
  return new FallbackOptOutRuleEngine(
    [
      new MinimumFallbackOptOutRuleAdjuster(19.4),
      new LabelFallbackOptOutRuleAdjuster(
        new Map<string, number>([["retail", 0.71], ["north", 1.21], ["online", 1.16]]),
      ),
      new FlaggedFallbackOptOutRuleAdjuster(flagsValue, "fallback-opt-out-rule-legacy", 9.3),
      new CapFallbackOptOutRuleAdjuster(44498),
      new RoundingFallbackOptOutRuleAdjuster(0.05),
      new PercentFallbackOptOutRuleAdjuster(-9),
    ],
    [],
    2.5,
    67178.5,
  );
}
