import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleGroup } from "./reward-rule-group.js";

/** One step of the reward rule group calculation. */
export interface RewardRuleGroupFactor {
  describe(): string;
  adjust(item: RewardRuleGroup, value: number): number;
}

export class PercentRewardRuleGroupAdjuster implements RewardRuleGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardRuleGroupAdjuster implements RewardRuleGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRewardRuleGroupAdjuster implements RewardRuleGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reward rule group steps in order and keeps a trace of each. */
export class RewardRuleGroupEngine {
  steps: RewardRuleGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleGroup): number {
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

  evaluateAll(items: RewardRuleGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleGroupEngine(): RewardRuleGroupEngine {
  return new RewardRuleGroupEngine(
    [
      new PercentRewardRuleGroupAdjuster(-10.3),
      new MinimumRewardRuleGroupAdjuster(24.7),
      new RoundingRewardRuleGroupAdjuster(5),
    ],
    [],
    2.4,
    13383.5,
  );
}
