import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingBidRulePreference } from "./rolling-bid-rule-preference.js";

/** One step of the rolling bid rule preference calculation. */
export interface RollingBidRulePreferenceStep {
  describe(): string;
  adjust(item: RollingBidRulePreference, value: number): number;
}

export class RollingBidRulePreferenceClicksOffsetAdjuster implements RollingBidRulePreferenceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: RollingBidRulePreference, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class FlaggedRollingBidRulePreferenceAdjuster implements RollingBidRulePreferenceStep {
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

  adjust(item: RollingBidRulePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingBidRulePreferenceAdjuster implements RollingBidRulePreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingBidRulePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRollingBidRulePreferenceAdjuster implements RollingBidRulePreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingBidRulePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleRollingBidRulePreferenceAdjuster implements RollingBidRulePreferenceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RollingBidRulePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRollingBidRulePreferenceAdjuster implements RollingBidRulePreferenceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingBidRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the rolling bid rule preference steps in order and keeps a trace of each. */
export class RollingBidRulePreferenceEngine {
  steps: RollingBidRulePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingBidRulePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingBidRulePreference): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RollingBidRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingBidRulePreferenceEngine(flagsValue: flags.Registry): RollingBidRulePreferenceEngine {
  return new RollingBidRulePreferenceEngine(
    [
      new RollingBidRulePreferenceClicksOffsetAdjuster(1.36),
      new FlaggedRollingBidRulePreferenceAdjuster(flagsValue, "rolling-bid-rule-preference-manual", 9.8),
      new RoundingRollingBidRulePreferenceAdjuster(0.05),
      new TieredRollingBidRulePreferenceAdjuster([230, 1461, 2661, 4508], [1.09, 1.02, 1.07, 1.18]),
      new TitleRollingBidRulePreferenceAdjuster(new Map<string, number>([["east", 1.33], ["south", 0.77]])),
      new MinimumRollingBidRulePreferenceAdjuster(40.3),
    ],
    [],
    0.7,
    93758.7,
  );
}
