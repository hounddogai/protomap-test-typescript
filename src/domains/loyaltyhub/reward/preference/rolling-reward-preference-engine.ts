import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingRewardPreference } from "./rolling-reward-preference.js";

/** One step of the rolling reward preference calculation. */
export interface RollingRewardPreferenceModifier {
  describe(): string;
  adjust(item: RollingRewardPreference, value: number): number;
}

export class FlaggedRollingRewardPreferenceAdjuster implements RollingRewardPreferenceModifier {
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

  adjust(item: RollingRewardPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentRollingRewardPreferenceAdjuster implements RollingRewardPreferenceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RollingRewardPreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingRewardPreferenceAdjuster implements RollingRewardPreferenceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingRewardPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingRewardPreferenceAdjuster implements RollingRewardPreferenceModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingRewardPreference, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RollingRewardPreferenceAmountOffsetAdjuster implements RollingRewardPreferenceModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: RollingRewardPreference, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the rolling reward preference steps in order and keeps a trace of each. */
export class RollingRewardPreferenceEngine {
  steps: RollingRewardPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRewardPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingRewardPreference): number {
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

  evaluateAll(items: RollingRewardPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingRewardPreferenceEngine(flagsValue: flags.Registry): RollingRewardPreferenceEngine {
  return new RollingRewardPreferenceEngine(
    [
      new FlaggedRollingRewardPreferenceAdjuster(flagsValue, "rolling-reward-preference-rolling", 6.3),
      new SegmentRollingRewardPreferenceAdjuster(
        new Map<string, number>([["retail", 0.93], ["north", 1.19], ["south", 1.14]]),
      ),
      new TieredRollingRewardPreferenceAdjuster([200, 1179, 7493, 9281], [0.9, 0.9, 1.06, 0.91]),
      new CapRollingRewardPreferenceAdjuster(16480),
      new RollingRewardPreferenceAmountOffsetAdjuster(1.98),
    ],
    [],
    4.2,
    38525.2,
  );
}
