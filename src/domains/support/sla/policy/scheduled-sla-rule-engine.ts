import * as flags from "../../../../kit/flags.js";
import { ScheduledSlaRule } from "./scheduled-sla-rule.js";

/** One step of the scheduled sla rule calculation. */
export interface ScheduledSlaRuleModifier {
  describe(): string;
  adjust(item: ScheduledSlaRule, value: number): number;
}

export class PercentScheduledSlaRuleAdjuster implements ScheduledSlaRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSlaRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedScheduledSlaRuleAdjuster implements ScheduledSlaRuleModifier {
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

  adjust(item: ScheduledSlaRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledSlaRuleAdjuster implements ScheduledSlaRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledSlaRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledSlaRuleAdjuster implements ScheduledSlaRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledSlaRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledSlaRuleBidOffsetAdjuster implements ScheduledSlaRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: ScheduledSlaRule, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the scheduled sla rule steps in order and keeps a trace of each. */
export class ScheduledSlaRuleEngine {
  steps: ScheduledSlaRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSlaRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledSlaRule): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ScheduledSlaRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledSlaRuleEngine(flagsValue: flags.Registry): ScheduledSlaRuleEngine {
  return new ScheduledSlaRuleEngine(
    [
      new PercentScheduledSlaRuleAdjuster(-8.1),
      new FlaggedScheduledSlaRuleAdjuster(flagsValue, "scheduled-sla-rule-legacy", -0.4),
      new CapScheduledSlaRuleAdjuster(33601),
      new TieredScheduledSlaRuleAdjuster([698, 4420, 5558], [1.18, 0.91, 1.01]),
      new ScheduledSlaRuleBidOffsetAdjuster(1.4),
    ],
    [],
    0,
    28002.7,
  );
}
