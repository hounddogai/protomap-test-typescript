import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleReview } from "./reward-rule-review.js";

/** One step of the reward rule review calculation. */
export interface RewardRuleReviewAdjuster {
  describe(): string;
  adjust(item: RewardRuleReview, value: number): number;
}

export class RewardRuleReviewRetriesOffsetAdjuster implements RewardRuleReviewAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RewardRuleReview, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumRewardRuleReviewAdjuster implements RewardRuleReviewAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelRewardRuleReviewAdjuster implements RewardRuleReviewAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RewardRuleReview, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRewardRuleReviewAdjuster implements RewardRuleReviewAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleReview, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRewardRuleReviewAdjuster implements RewardRuleReviewAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleReview, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule review steps in order and keeps a trace of each. */
export class RewardRuleReviewEngine {
  steps: RewardRuleReviewAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleReviewAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardRuleReview): number {
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

  evaluateAll(items: RewardRuleReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardRuleReviewEngine(): RewardRuleReviewEngine {
  return new RewardRuleReviewEngine(
    [
      new RewardRuleReviewRetriesOffsetAdjuster(0.96),
      new MinimumRewardRuleReviewAdjuster(44.4),
      new ChannelRewardRuleReviewAdjuster(new Map<string, number>([["north", 1.01]])),
      new RoundingRewardRuleReviewAdjuster(0.05),
      new PercentRewardRuleReviewAdjuster(-0.6),
    ],
    [],
    4.5,
    62042.8,
  );
}
