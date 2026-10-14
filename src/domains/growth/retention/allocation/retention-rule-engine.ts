import * as flags from "../../../../kit/flags.js";
import { RetentionRule } from "./retention-rule.js";

/** One step of the retention rule calculation. */
export interface RetentionRuleModifier {
  describe(): string;
  adjust(item: RetentionRule, value: number): number;
}

export class PercentRetentionRuleAdjuster implements RetentionRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RetentionRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRetentionRuleAdjuster implements RetentionRuleModifier {
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

  adjust(item: RetentionRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRetentionRuleAdjuster implements RetentionRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RetentionRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RetentionRuleBudgetOffsetAdjuster implements RetentionRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: RetentionRule, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class NameRetentionRuleAdjuster implements RetentionRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RetentionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the retention rule steps in order and keeps a trace of each. */
export class RetentionRuleEngine {
  steps: RetentionRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RetentionRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RetentionRule): number {
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

  evaluateAll(items: RetentionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRetentionRuleEngine(flagsValue: flags.Registry): RetentionRuleEngine {
  return new RetentionRuleEngine(
    [
      new PercentRetentionRuleAdjuster(-7),
      new FlaggedRetentionRuleAdjuster(flagsValue, "retention-rule-fallback", 1.8),
      new CapRetentionRuleAdjuster(29093),
      new RetentionRuleBudgetOffsetAdjuster(0.97),
      new NameRetentionRuleAdjuster(new Map<string, number>([["south", 1.2], ["west", 1.23], ["online", 1.04]])),
    ],
    [],
    2.4,
    5605.7,
  );
}
