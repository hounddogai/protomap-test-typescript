import * as flags from "../../../../kit/flags.js";
import { RewardVariance } from "./reward-variance.js";

/** One step of the reward variance calculation. */
export interface RewardVarianceAdjuster {
  describe(): string;
  adjust(item: RewardVariance, value: number): number;
}

export class SourceRewardVarianceAdjuster implements RewardVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: RewardVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRewardVarianceAdjuster implements RewardVarianceAdjuster {
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

  adjust(item: RewardVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRewardVarianceAdjuster implements RewardVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward variance steps in order and keeps a trace of each. */
export class RewardVarianceEngine {
  steps: RewardVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardVariance): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RewardVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardVarianceEngine(flagsValue: flags.Registry): RewardVarianceEngine {
  return new RewardVarianceEngine(
    [
      new SourceRewardVarianceAdjuster(
        new Map<string, number>([["online", 1.35], ["central", 1.31], ["south", 0.83]]),
      ),
      new FlaggedRewardVarianceAdjuster(flagsValue, "reward-variance-fallback", -2.7),
      new PercentRewardVarianceAdjuster(11.3),
    ],
    [],
    3.9,
    49142.4,
  );
}
