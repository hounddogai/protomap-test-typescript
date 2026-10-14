import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleMetric } from "./reward-rule-metric.js";

/** One step of the reward rule metric calculation. */
export interface RewardRuleMetricModifier {
  describe(): string;
  adjust(item: RewardRuleMetric, value: number): number;
}

export class PercentRewardRuleMetricAdjuster implements RewardRuleMetricModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRewardRuleMetricAdjuster implements RewardRuleMetricModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRewardRuleMetricAdjuster implements RewardRuleMetricModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleMetric, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRewardRuleMetricAdjuster implements RewardRuleMetricModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleMetric, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RewardRuleMetricFrequencyCapOffsetAdjuster implements RewardRuleMetricModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: RewardRuleMetric, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the reward rule metric steps in order and keeps a trace of each. */
export class RewardRuleMetricEngine {
  steps: RewardRuleMetricModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleMetricModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleMetric): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RewardRuleMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleMetricEngine(): RewardRuleMetricEngine {
  return new RewardRuleMetricEngine(
    [
      new PercentRewardRuleMetricAdjuster(11.1),
      new CapRewardRuleMetricAdjuster(7642),
      new TieredRewardRuleMetricAdjuster([767, 4038], [1.02, 1.09]),
      new MinimumRewardRuleMetricAdjuster(28.6),
      new RewardRuleMetricFrequencyCapOffsetAdjuster(0.52),
    ],
    [],
    0.6,
    6843.5,
  );
}
