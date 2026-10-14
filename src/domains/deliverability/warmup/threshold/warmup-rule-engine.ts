import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupRule } from "./warmup-rule.js";

/** One step of the warmup rule calculation. */
export interface WarmupRuleModifier {
  describe(): string;
  adjust(item: WarmupRule, value: number): number;
}

export class FlaggedWarmupRuleAdjuster implements WarmupRuleModifier {
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

  adjust(item: WarmupRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWarmupRuleAdjuster implements WarmupRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitleWarmupRuleAdjuster implements WarmupRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WarmupRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WarmupRuleStartsAtOffsetAdjuster implements WarmupRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: WarmupRule, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class PercentWarmupRuleAdjuster implements WarmupRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWarmupRuleAdjuster implements WarmupRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the warmup rule steps in order and keeps a trace of each. */
export class WarmupRuleEngine {
  steps: WarmupRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupRule): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: WarmupRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupRuleEngine(flagsValue: flags.Registry): WarmupRuleEngine {
  return new WarmupRuleEngine(
    [
      new FlaggedWarmupRuleAdjuster(flagsValue, "warmup-rule-default", 6.2),
      new MinimumWarmupRuleAdjuster(14.7),
      new TitleWarmupRuleAdjuster(new Map<string, number>([["south", 0.96]])),
      new WarmupRuleStartsAtOffsetAdjuster(1.24),
      new PercentWarmupRuleAdjuster(2.1),
      new RoundingWarmupRuleAdjuster(0.25),
    ],
    [],
    2.3,
    83727,
  );
}
