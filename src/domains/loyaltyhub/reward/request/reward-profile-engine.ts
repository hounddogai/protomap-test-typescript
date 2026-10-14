import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardProfile } from "./reward-profile.js";

/** One step of the reward profile calculation. */
export interface RewardProfileStep {
  describe(): string;
  adjust(item: RewardProfile, value: number): number;
}

export class FlaggedRewardProfileAdjuster implements RewardProfileStep {
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

  adjust(item: RewardProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RewardProfileFrequencyCapOffsetAdjuster implements RewardProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: RewardProfile, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class PercentRewardProfileAdjuster implements RewardProfileStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward profile steps in order and keeps a trace of each. */
export class RewardProfileEngine {
  steps: RewardProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardProfile): number {
    let current = item.netTotal();
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

  evaluateAll(items: RewardProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardProfileEngine(flagsValue: flags.Registry): RewardProfileEngine {
  return new RewardProfileEngine(
    [
      new FlaggedRewardProfileAdjuster(flagsValue, "reward-profile-strict", -7.9),
      new RewardProfileFrequencyCapOffsetAdjuster(0.58),
      new PercentRewardProfileAdjuster(14.7),
    ],
    [],
    1.9,
    51104.4,
  );
}
