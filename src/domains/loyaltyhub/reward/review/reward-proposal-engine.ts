import * as numbers from "../../../../kit/numbers.js";
import { RewardProposal } from "./reward-proposal.js";

/** One step of the reward proposal calculation. */
export interface RewardProposalModifier {
  describe(): string;
  adjust(item: RewardProposal, value: number): number;
}

export class NameRewardProposalAdjuster implements RewardProposalModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RewardProposal, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RewardProposalDiscountOffsetAdjuster implements RewardProposalModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RewardProposal, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class RoundingRewardProposalAdjuster implements RewardProposalModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRewardProposalAdjuster implements RewardProposalModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardProposalAdjuster implements RewardProposalModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRewardProposalAdjuster implements RewardProposalModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reward proposal steps in order and keeps a trace of each. */
export class RewardProposalEngine {
  steps: RewardProposalModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardProposalModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardProposal): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardProposalEngine(): RewardProposalEngine {
  return new RewardProposalEngine(
    [
      new NameRewardProposalAdjuster(new Map<string, number>([["central", 1.31]])),
      new RewardProposalDiscountOffsetAdjuster(0.09),
      new RoundingRewardProposalAdjuster(0.5),
      new PercentRewardProposalAdjuster(12.2),
      new MinimumRewardProposalAdjuster(42.4),
      new CapRewardProposalAdjuster(22798),
    ],
    [],
    3.1,
    21988.2,
  );
}
