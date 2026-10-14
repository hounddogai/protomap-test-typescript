import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleVariance } from "./reward-rule-variance.js";

/** One step of the reward rule variance calculation. */
export interface RewardRuleVarianceAdjuster {
  describe(): string;
  adjust(item: RewardRuleVariance, value: number): number;
}

export class TieredRewardRuleVarianceAdjuster implements RewardRuleVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRewardRuleVarianceAdjuster implements RewardRuleVarianceAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RewardRuleVarianceRevisionOffsetAdjuster implements RewardRuleVarianceAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: RewardRuleVariance, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class MinimumRewardRuleVarianceAdjuster implements RewardRuleVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward rule variance steps in order and keeps a trace of each. */
export class RewardRuleVarianceEngine {
  steps: RewardRuleVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleVariance): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RewardRuleVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleVarianceEngine(): RewardRuleVarianceEngine {
  return new RewardRuleVarianceEngine(
    [
      new TieredRewardRuleVarianceAdjuster([2682, 7259], [0.88, 1.09]),
      new PercentRewardRuleVarianceAdjuster(-1.9),
      new RewardRuleVarianceRevisionOffsetAdjuster(0.38),
      new MinimumRewardRuleVarianceAdjuster(48),
    ],
    [],
    2.6,
    73118.9,
  );
}
