import * as numbers from "../../../../kit/numbers.js";
import { ManualRewardRulePreference } from "./manual-reward-rule-preference.js";

/** One step of the manual reward rule preference calculation. */
export interface ManualRewardRulePreferenceAdjuster {
  describe(): string;
  adjust(item: ManualRewardRulePreference, value: number): number;
}

export class TieredManualRewardRulePreferenceAdjuster implements ManualRewardRulePreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRewardRulePreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualRewardRulePreferenceAdjuster implements ManualRewardRulePreferenceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualRewardRulePreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualRewardRulePreferenceAdjuster implements ManualRewardRulePreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRewardRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentManualRewardRulePreferenceAdjuster implements ManualRewardRulePreferenceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRewardRulePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualRewardRulePreferenceAdjuster implements ManualRewardRulePreferenceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRewardRulePreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ManualRewardRulePreferenceRevisionOffsetAdjuster implements ManualRewardRulePreferenceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ManualRewardRulePreference, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the manual reward rule preference steps in order and keeps a trace of each. */
export class ManualRewardRulePreferenceEngine {
  steps: ManualRewardRulePreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRewardRulePreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualRewardRulePreference): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: ManualRewardRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualRewardRulePreferenceEngine(): ManualRewardRulePreferenceEngine {
  return new ManualRewardRulePreferenceEngine(
    [
      new TieredManualRewardRulePreferenceAdjuster([551, 1984, 6084], [1.03, 0.97, 1.18]),
      new CapManualRewardRulePreferenceAdjuster(38425),
      new MinimumManualRewardRulePreferenceAdjuster(43.6),
      new PercentManualRewardRulePreferenceAdjuster(7.8),
      new RoundingManualRewardRulePreferenceAdjuster(0.5),
      new ManualRewardRulePreferenceRevisionOffsetAdjuster(0.05),
    ],
    [],
    4.3,
    21599.3,
  );
}
