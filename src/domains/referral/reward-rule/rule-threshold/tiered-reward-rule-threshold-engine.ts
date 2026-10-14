import * as numbers from "../../../../kit/numbers.js";
import { TieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

/** One step of the tiered reward rule threshold calculation. */
export interface TieredRewardRuleThresholdAdjuster {
  describe(): string;
  adjust(item: TieredRewardRuleThreshold, value: number): number;
}

export class LabelTieredRewardRuleThresholdAdjuster implements TieredRewardRuleThresholdAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredRewardRuleThreshold, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRewardRuleThresholdBidOffsetAdjuster implements TieredRewardRuleThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: TieredRewardRuleThreshold, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapTieredRewardRuleThresholdAdjuster implements TieredRewardRuleThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredRewardRuleThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredRewardRuleThresholdAdjuster implements TieredRewardRuleThresholdAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRewardRuleThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredRewardRuleThresholdAdjuster implements TieredRewardRuleThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRewardRuleThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered reward rule threshold steps in order and keeps a trace of each. */
export class TieredRewardRuleThresholdEngine {
  steps: TieredRewardRuleThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardRuleThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredRewardRuleThreshold): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TieredRewardRuleThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredRewardRuleThresholdEngine(): TieredRewardRuleThresholdEngine {
  return new TieredRewardRuleThresholdEngine(
    [
      new LabelTieredRewardRuleThresholdAdjuster(
        new Map<string, number>([["central", 0.9], ["west", 0.91], ["online", 0.78]]),
      ),
      new TieredRewardRuleThresholdBidOffsetAdjuster(1.21),
      new CapTieredRewardRuleThresholdAdjuster(32205),
      new PercentTieredRewardRuleThresholdAdjuster(-1.1),
      new TieredTieredRewardRuleThresholdAdjuster([2782, 5019, 8223], [1.08, 1.03, 0.98]),
    ],
    [],
    0.9,
    2446.4,
  );
}
