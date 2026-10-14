import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictRewardRulePreference } from "./strict-reward-rule-preference.js";

/** One step of the strict reward rule preference calculation. */
export interface StrictRewardRulePreferenceAdjuster {
  describe(): string;
  adjust(item: StrictRewardRulePreference, value: number): number;
}

export class FlaggedStrictRewardRulePreferenceAdjuster implements StrictRewardRulePreferenceAdjuster {
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

  adjust(item: StrictRewardRulePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictRewardRulePreferenceAdjuster implements StrictRewardRulePreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictRewardRulePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class StrictRewardRulePreferenceRetriesOffsetAdjuster implements StrictRewardRulePreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: StrictRewardRulePreference, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class RoundingStrictRewardRulePreferenceAdjuster implements StrictRewardRulePreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictRewardRulePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictRewardRulePreferenceAdjuster implements StrictRewardRulePreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictRewardRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelStrictRewardRulePreferenceAdjuster implements StrictRewardRulePreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: StrictRewardRulePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the strict reward rule preference steps in order and keeps a trace of each. */
export class StrictRewardRulePreferenceEngine {
  steps: StrictRewardRulePreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRewardRulePreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictRewardRulePreference): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: StrictRewardRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictRewardRulePreferenceEngine(flagsValue: flags.Registry): StrictRewardRulePreferenceEngine {
  return new StrictRewardRulePreferenceEngine(
    [
      new FlaggedStrictRewardRulePreferenceAdjuster(flagsValue, "strict-reward-rule-preference-weighted", 1.2),
      new TieredStrictRewardRulePreferenceAdjuster([1040, 7748], [1.09, 1.01]),
      new StrictRewardRulePreferenceRetriesOffsetAdjuster(1.74),
      new RoundingStrictRewardRulePreferenceAdjuster(0.1),
      new MinimumStrictRewardRulePreferenceAdjuster(7.2),
      new LabelStrictRewardRulePreferenceAdjuster(new Map<string, number>([["online", 0.74]])),
    ],
    [],
    3.4,
    39776.6,
  );
}
