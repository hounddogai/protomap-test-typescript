import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedRewardRulePreference } from "./weighted-reward-rule-preference.js";

/** One step of the weighted reward rule preference calculation. */
export interface WeightedRewardRulePreferenceStep {
  describe(): string;
  adjust(item: WeightedRewardRulePreference, value: number): number;
}

export class RoundingWeightedRewardRulePreferenceAdjuster implements WeightedRewardRulePreferenceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRewardRulePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedRewardRulePreferenceUpdatedAtOffsetAdjuster implements WeightedRewardRulePreferenceStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WeightedRewardRulePreference, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CapWeightedRewardRulePreferenceAdjuster implements WeightedRewardRulePreferenceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRewardRulePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedRewardRulePreferenceAdjuster implements WeightedRewardRulePreferenceStep {
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

  adjust(item: WeightedRewardRulePreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedRewardRulePreferenceAdjuster implements WeightedRewardRulePreferenceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRewardRulePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted reward rule preference steps in order and keeps a trace of each. */
export class WeightedRewardRulePreferenceEngine {
  steps: WeightedRewardRulePreferenceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardRulePreferenceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedRewardRulePreference): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedRewardRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedRewardRulePreferenceEngine(flagsValue: flags.Registry): WeightedRewardRulePreferenceEngine {
  return new WeightedRewardRulePreferenceEngine(
    [
      new RoundingWeightedRewardRulePreferenceAdjuster(0.05),
      new WeightedRewardRulePreferenceUpdatedAtOffsetAdjuster(1.41),
      new CapWeightedRewardRulePreferenceAdjuster(16247),
      new FlaggedWeightedRewardRulePreferenceAdjuster(
        flagsValue,
        "weighted-reward-rule-preference-rolling",
        -4.9,
      ),
      new TieredWeightedRewardRulePreferenceAdjuster([980, 3767, 4048, 5178], [0.87, 0.83, 0.9, 0.81]),
    ],
    [],
    4.9,
    10805.6,
  );
}
