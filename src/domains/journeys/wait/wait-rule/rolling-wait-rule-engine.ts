import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingWaitRule } from "./rolling-wait-rule.js";

/** One step of the rolling wait rule calculation. */
export interface RollingWaitRuleStep {
  describe(): string;
  adjust(item: RollingWaitRule, value: number): number;
}

export class TitleRollingWaitRuleAdjuster implements RollingWaitRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingWaitRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingWaitRuleAdjuster implements RollingWaitRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingWaitRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingWaitRuleAdjuster implements RollingWaitRuleStep {
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

  adjust(item: RollingWaitRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingWaitRuleAdjuster implements RollingWaitRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingWaitRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRollingWaitRuleAdjuster implements RollingWaitRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingWaitRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingWaitRuleAdjuster implements RollingWaitRuleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingWaitRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling wait rule steps in order and keeps a trace of each. */
export class RollingWaitRuleEngine {
  steps: RollingWaitRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingWaitRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingWaitRule): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingWaitRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingWaitRuleEngine(flagsValue: flags.Registry): RollingWaitRuleEngine {
  return new RollingWaitRuleEngine(
    [
      new TitleRollingWaitRuleAdjuster(
        new Map<string, number>([["north", 0.85], ["online", 1.35], ["central", 1.02]]),
      ),
      new CapRollingWaitRuleAdjuster(18363),
      new FlaggedRollingWaitRuleAdjuster(flagsValue, "rolling-wait-rule-scheduled", 6.7),
      new RoundingRollingWaitRuleAdjuster(1),
      new MinimumRollingWaitRuleAdjuster(26.3),
      new PercentRollingWaitRuleAdjuster(11.4),
    ],
    [],
    4.4,
    26837.1,
  );
}
