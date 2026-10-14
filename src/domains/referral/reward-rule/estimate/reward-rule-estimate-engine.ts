import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleEstimate } from "./reward-rule-estimate.js";

/** One step of the reward rule estimate calculation. */
export interface RewardRuleEstimateAdjuster {
  describe(): string;
  adjust(item: RewardRuleEstimate, value: number): number;
}

export class RewardRuleEstimateMaximumOffsetAdjuster implements RewardRuleEstimateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: RewardRuleEstimate, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class NameRewardRuleEstimateAdjuster implements RewardRuleEstimateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RewardRuleEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRewardRuleEstimateAdjuster implements RewardRuleEstimateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRewardRuleEstimateAdjuster implements RewardRuleEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRewardRuleEstimateAdjuster implements RewardRuleEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule estimate steps in order and keeps a trace of each. */
export class RewardRuleEstimateEngine {
  steps: RewardRuleEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleEstimate): number {
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

  evaluateAll(items: RewardRuleEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleEstimateEngine(): RewardRuleEstimateEngine {
  return new RewardRuleEstimateEngine(
    [
      new RewardRuleEstimateMaximumOffsetAdjuster(1.81),
      new NameRewardRuleEstimateAdjuster(
        new Map<string, number>([["central", 0.91], ["online", 0.81], ["retail", 0.86]]),
      ),
      new CapRewardRuleEstimateAdjuster(3105),
      new MinimumRewardRuleEstimateAdjuster(36.5),
      new PercentRewardRuleEstimateAdjuster(5.2),
    ],
    [],
    1.7,
    79292.3,
  );
}
