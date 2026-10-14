import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardPreference } from "./reward-preference.js";

/** One step of the reward preference calculation. */
export interface RewardPreferenceFactor {
  describe(): string;
  adjust(item: RewardPreference, value: number): number;
}

export class RewardPreferenceCreatedAtOffsetAdjuster implements RewardPreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: RewardPreference, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class FlaggedRewardPreferenceAdjuster implements RewardPreferenceFactor {
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

  adjust(item: RewardPreference, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardPreferenceAdjuster implements RewardPreferenceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardPreference, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward preference steps in order and keeps a trace of each. */
export class RewardPreferenceEngine {
  steps: RewardPreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardPreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardPreference): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RewardPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardPreferenceEngine(flagsValue: flags.Registry): RewardPreferenceEngine {
  return new RewardPreferenceEngine(
    [
      new RewardPreferenceCreatedAtOffsetAdjuster(0.74),
      new FlaggedRewardPreferenceAdjuster(flagsValue, "reward-preference-strict", 3.2),
      new TieredRewardPreferenceAdjuster([4419, 8068, 8628, 8703], [0.81, 1.02, 0.91, 0.88]),
    ],
    [],
    0.2,
    6707.5,
  );
}
