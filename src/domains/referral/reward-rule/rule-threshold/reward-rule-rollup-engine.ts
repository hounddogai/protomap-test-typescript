import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleRollup } from "./reward-rule-rollup.js";

/** One step of the reward rule rollup calculation. */
export interface RewardRuleRollupFactor {
  describe(): string;
  adjust(item: RewardRuleRollup, value: number): number;
}

export class MinimumRewardRuleRollupAdjuster implements RewardRuleRollupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RewardRuleRollupSequenceOffsetAdjuster implements RewardRuleRollupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: RewardRuleRollup, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TitleRewardRuleRollupAdjuster implements RewardRuleRollupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RewardRuleRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward rule rollup steps in order and keeps a trace of each. */
export class RewardRuleRollupEngine {
  steps: RewardRuleRollupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleRollupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardRuleRollup): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: RewardRuleRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardRuleRollupEngine(): RewardRuleRollupEngine {
  return new RewardRuleRollupEngine(
    [
      new MinimumRewardRuleRollupAdjuster(45.6),
      new RewardRuleRollupSequenceOffsetAdjuster(1.07),
      new TitleRewardRuleRollupAdjuster(new Map<string, number>([["retail", 1.19]])),
    ],
    [],
    2,
    92259,
  );
}
