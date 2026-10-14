import * as flags from "../../../../kit/flags.js";
import { RewardRuleProposal } from "./reward-rule-proposal.js";

/** One step of the reward rule proposal calculation. */
export interface RewardRuleProposalAdjuster {
  describe(): string;
  adjust(item: RewardRuleProposal, value: number): number;
}

export class MinimumRewardRuleProposalAdjuster implements RewardRuleProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRewardRuleProposalAdjuster implements RewardRuleProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRewardRuleProposalAdjuster implements RewardRuleProposalAdjuster {
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

  adjust(item: RewardRuleProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRewardRuleProposalAdjuster implements RewardRuleProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RewardRuleProposalMaximumOffsetAdjuster implements RewardRuleProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: RewardRuleProposal, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class CountryRewardRuleProposalAdjuster implements RewardRuleProposalAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RewardRuleProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward rule proposal steps in order and keeps a trace of each. */
export class RewardRuleProposalEngine {
  steps: RewardRuleProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleProposal): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardRuleProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleProposalEngine(flagsValue: flags.Registry): RewardRuleProposalEngine {
  return new RewardRuleProposalEngine(
    [
      new MinimumRewardRuleProposalAdjuster(5.2),
      new TieredRewardRuleProposalAdjuster([3441, 5767], [1.09, 0.89]),
      new FlaggedRewardRuleProposalAdjuster(flagsValue, "reward-rule-proposal-default", 5.6),
      new PercentRewardRuleProposalAdjuster(9.5),
      new RewardRuleProposalMaximumOffsetAdjuster(1.65),
      new CountryRewardRuleProposalAdjuster(new Map<string, number>([["central", 0.95]])),
    ],
    [],
    0.1,
    70725.4,
  );
}
