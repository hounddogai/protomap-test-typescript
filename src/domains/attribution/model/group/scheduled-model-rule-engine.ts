import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledModelRule } from "./scheduled-model-rule.js";

/** One step of the scheduled model rule calculation. */
export interface ScheduledModelRuleStep {
  describe(): string;
  adjust(item: ScheduledModelRule, value: number): number;
}

export class FlaggedScheduledModelRuleAdjuster implements ScheduledModelRuleStep {
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

  adjust(item: ScheduledModelRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleScheduledModelRuleAdjuster implements ScheduledModelRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ScheduledModelRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingScheduledModelRuleAdjuster implements ScheduledModelRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledModelRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ScheduledModelRuleBidOffsetAdjuster implements ScheduledModelRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: ScheduledModelRule, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the scheduled model rule steps in order and keeps a trace of each. */
export class ScheduledModelRuleEngine {
  steps: ScheduledModelRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledModelRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledModelRule): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ScheduledModelRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledModelRuleEngine(flagsValue: flags.Registry): ScheduledModelRuleEngine {
  return new ScheduledModelRuleEngine(
    [
      new FlaggedScheduledModelRuleAdjuster(flagsValue, "scheduled-model-rule-scheduled", -0.5),
      new LocaleScheduledModelRuleAdjuster(
        new Map<string, number>([["retail", 1.29], ["east", 1.06], ["north", 1.35]]),
      ),
      new RoundingScheduledModelRuleAdjuster(0.05),
      new ScheduledModelRuleBidOffsetAdjuster(0.38),
    ],
    [],
    2,
    59022.1,
  );
}
