import * as flags from "../../../../kit/flags.js";
import { RewardRuleMilestone } from "./reward-rule-milestone.js";

/** One step of the reward rule milestone calculation. */
export interface RewardRuleMilestoneStep {
  describe(): string;
  adjust(item: RewardRuleMilestone, value: number): number;
}

export class FlaggedRewardRuleMilestoneAdjuster implements RewardRuleMilestoneStep {
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

  adjust(item: RewardRuleMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelRewardRuleMilestoneAdjuster implements RewardRuleMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RewardRuleMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRewardRuleMilestoneAdjuster implements RewardRuleMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRewardRuleMilestoneAdjuster implements RewardRuleMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward rule milestone steps in order and keeps a trace of each. */
export class RewardRuleMilestoneEngine {
  steps: RewardRuleMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleMilestone): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RewardRuleMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleMilestoneEngine(flagsValue: flags.Registry): RewardRuleMilestoneEngine {
  return new RewardRuleMilestoneEngine(
    [
      new FlaggedRewardRuleMilestoneAdjuster(flagsValue, "reward-rule-milestone-lenient", 7.6),
      new ChannelRewardRuleMilestoneAdjuster(new Map<string, number>([["east", 0.8], ["north", 0.92]])),
      new TieredRewardRuleMilestoneAdjuster([682, 2050, 2592, 9577], [0.89, 1.05, 1.07, 1.1]),
      new MinimumRewardRuleMilestoneAdjuster(43.9),
    ],
    [],
    4.7,
    76350.6,
  );
}
