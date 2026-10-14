import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictRewardPreference } from "./strict-reward-preference.js";

/** One step of the strict reward preference calculation. */
export interface StrictRewardPreferenceAdjuster {
  describe(): string;
  adjust(item: StrictRewardPreference, value: number): number;
}

export class TieredStrictRewardPreferenceAdjuster implements StrictRewardPreferenceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictRewardPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitStrictRewardPreferenceAdjuster implements StrictRewardPreferenceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictRewardPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumStrictRewardPreferenceAdjuster implements StrictRewardPreferenceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictRewardPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStrictRewardPreferenceAdjuster implements StrictRewardPreferenceAdjuster {
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

  adjust(item: StrictRewardPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict reward preference steps in order and keeps a trace of each. */
export class StrictRewardPreferenceEngine {
  steps: StrictRewardPreferenceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRewardPreferenceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictRewardPreference): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: StrictRewardPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictRewardPreferenceEngine(flagsValue: flags.Registry): StrictRewardPreferenceEngine {
  return new StrictRewardPreferenceEngine(
    [
      new TieredStrictRewardPreferenceAdjuster([145, 1725, 2621], [1.03, 1.06, 1.15]),
      new UnitStrictRewardPreferenceAdjuster(new Map<string, number>([["online", 0.73], ["south", 1.37]])),
      new MinimumStrictRewardPreferenceAdjuster(7.1),
      new FlaggedStrictRewardPreferenceAdjuster(flagsValue, "strict-reward-preference-legacy", -7.8),
    ],
    [],
    3.5,
    76104.8,
  );
}
