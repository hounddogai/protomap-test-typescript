import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardThreshold } from "./reward-threshold.js";

/** One step of the reward threshold calculation. */
export interface RewardThresholdFactor {
  describe(): string;
  adjust(item: RewardThreshold, value: number): number;
}

export class PercentRewardThresholdAdjuster implements RewardThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRewardThresholdAdjuster implements RewardThresholdFactor {
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

  adjust(item: RewardThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardThresholdAdjuster implements RewardThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward threshold steps in order and keeps a trace of each. */
export class RewardThresholdEngine {
  steps: RewardThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardThreshold): number {
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

  evaluateAll(items: RewardThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardThresholdEngine(flagsValue: flags.Registry): RewardThresholdEngine {
  return new RewardThresholdEngine(
    [
      new PercentRewardThresholdAdjuster(21.6),
      new FlaggedRewardThresholdAdjuster(flagsValue, "reward-threshold-legacy", 4.2),
      new MinimumRewardThresholdAdjuster(37.4),
    ],
    [],
    1.7,
    17002.9,
  );
}
