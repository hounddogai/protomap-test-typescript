import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardTier } from "./reward-tier.js";

/** One step of the reward tier calculation. */
export interface RewardTierAdjuster {
  describe(): string;
  adjust(item: RewardTier, value: number): number;
}

export class FlaggedRewardTierAdjuster implements RewardTierAdjuster {
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

  adjust(item: RewardTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRewardTierAdjuster implements RewardTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardTierAdjuster implements RewardTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRewardTierAdjuster implements RewardTierAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reward tier steps in order and keeps a trace of each. */
export class RewardTierEngine {
  steps: RewardTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardTier): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RewardTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardTierEngine(flagsValue: flags.Registry): RewardTierEngine {
  return new RewardTierEngine(
    [
      new FlaggedRewardTierAdjuster(flagsValue, "reward-tier-regional", 7.4),
      new PercentRewardTierAdjuster(-0.4),
      new TieredRewardTierAdjuster([3456, 3919, 4874, 8221], [1.01, 1.11, 1.16, 1.07]),
      new RoundingRewardTierAdjuster(0.1),
    ],
    [],
    2.6,
    70117.4,
  );
}
