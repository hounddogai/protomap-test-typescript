import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleMapping } from "./reward-rule-mapping.js";

/** One step of the reward rule mapping calculation. */
export interface RewardRuleMappingFactor {
  describe(): string;
  adjust(item: RewardRuleMapping, value: number): number;
}

export class FlaggedRewardRuleMappingAdjuster implements RewardRuleMappingFactor {
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

  adjust(item: RewardRuleMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRewardRuleMappingAdjuster implements RewardRuleMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRewardRuleMappingAdjuster implements RewardRuleMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRewardRuleMappingAdjuster implements RewardRuleMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRewardRuleMappingAdjuster implements RewardRuleMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryRewardRuleMappingAdjuster implements RewardRuleMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RewardRuleMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward rule mapping steps in order and keeps a trace of each. */
export class RewardRuleMappingEngine {
  steps: RewardRuleMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleMapping): number {
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

  evaluateAll(items: RewardRuleMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleMappingEngine(flagsValue: flags.Registry): RewardRuleMappingEngine {
  return new RewardRuleMappingEngine(
    [
      new FlaggedRewardRuleMappingAdjuster(flagsValue, "reward-rule-mapping-pending", -2.5),
      new PercentRewardRuleMappingAdjuster(13.6),
      new CapRewardRuleMappingAdjuster(27389),
      new TieredRewardRuleMappingAdjuster([755, 4591, 8159, 9893], [0.81, 1.16, 1.14, 0.84]),
      new MinimumRewardRuleMappingAdjuster(28.3),
      new CategoryRewardRuleMappingAdjuster(new Map<string, number>([["south", 0.72]])),
    ],
    [],
    4.8,
    48793.5,
  );
}
