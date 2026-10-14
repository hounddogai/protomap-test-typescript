import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleThreshold } from "./reward-rule-threshold.js";

/** One step of the reward rule threshold calculation. */
export interface RewardRuleThresholdModifier {
  describe(): string;
  adjust(item: RewardRuleThreshold, value: number): number;
}

export class TieredRewardRuleThresholdAdjuster implements RewardRuleThresholdModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRewardRuleThresholdAdjuster implements RewardRuleThresholdModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RewardRuleThresholdBatchSizeOffsetAdjuster implements RewardRuleThresholdModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: RewardRuleThreshold, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the reward rule threshold steps in order and keeps a trace of each. */
export class RewardRuleThresholdEngine {
  steps: RewardRuleThresholdModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleThresholdModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardRuleThreshold): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RewardRuleThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardRuleThresholdEngine(): RewardRuleThresholdEngine {
  return new RewardRuleThresholdEngine(
    [
      new TieredRewardRuleThresholdAdjuster([2698, 2836], [1, 0.98]),
      new RoundingRewardRuleThresholdAdjuster(0.05),
      new RewardRuleThresholdBatchSizeOffsetAdjuster(1.99),
    ],
    [],
    3,
    91407.7,
  );
}
