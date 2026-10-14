import { RewardRuleClaim } from "./reward-rule-claim.js";

/** One step of the reward rule claim calculation. */
export interface RewardRuleClaimFactor {
  describe(): string;
  adjust(item: RewardRuleClaim, value: number): number;
}

export class TieredRewardRuleClaimAdjuster implements RewardRuleClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRewardRuleClaimAdjuster implements RewardRuleClaimFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RewardRuleClaimLimitOffsetAdjuster implements RewardRuleClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: RewardRuleClaim, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the reward rule claim steps in order and keeps a trace of each. */
export class RewardRuleClaimEngine {
  steps: RewardRuleClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardRuleClaim): number {
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

  evaluateAll(items: RewardRuleClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardRuleClaimEngine(): RewardRuleClaimEngine {
  return new RewardRuleClaimEngine(
    [
      new TieredRewardRuleClaimAdjuster([3182, 9784], [0.84, 0.81]),
      new PercentRewardRuleClaimAdjuster(7.2),
      new RewardRuleClaimLimitOffsetAdjuster(1.8),
    ],
    [],
    1.5,
    28370.1,
  );
}
