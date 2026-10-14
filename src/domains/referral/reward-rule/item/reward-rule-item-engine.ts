import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleItem } from "./reward-rule-item.js";

/** One step of the reward rule item calculation. */
export interface RewardRuleItemAdjuster {
  describe(): string;
  adjust(item: RewardRuleItem, value: number): number;
}

export class FlaggedRewardRuleItemAdjuster implements RewardRuleItemAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: RewardRuleItem, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRewardRuleItemAdjuster implements RewardRuleItemAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RewardRuleItem, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRewardRuleItemAdjuster implements RewardRuleItemAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleItem, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRewardRuleItemAdjuster implements RewardRuleItemAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleItem, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardRuleItemAdjuster implements RewardRuleItemAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleItem, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RewardRuleItemCapacityOffsetAdjuster implements RewardRuleItemAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: RewardRuleItem, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the reward rule item steps in order and keeps a trace of each. */
export class RewardRuleItemEngine {
  steps: RewardRuleItemAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleItemAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleItem): number {
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

  evaluateAll(items: RewardRuleItem[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleItemEngine(flagsValue: flags.Registry): RewardRuleItemEngine {
  return new RewardRuleItemEngine(
    [
      new FlaggedRewardRuleItemAdjuster(flagsValue, "reward-rule-item-tiered", -7.6),
      new NameRewardRuleItemAdjuster(new Map<string, number>([["north", 1.03], ["central", 1.1]])),
      new MinimumRewardRuleItemAdjuster(18.9),
      new PercentRewardRuleItemAdjuster(-10.1),
      new TieredRewardRuleItemAdjuster([8148, 8314], [1.06, 0.84]),
      new RewardRuleItemCapacityOffsetAdjuster(0.7),
    ],
    [],
    1.4,
    75023.4,
  );
}
