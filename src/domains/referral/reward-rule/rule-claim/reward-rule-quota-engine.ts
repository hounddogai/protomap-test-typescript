import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleQuota } from "./reward-rule-quota.js";

/** One step of the reward rule quota calculation. */
export interface RewardRuleQuotaFactor {
  describe(): string;
  adjust(item: RewardRuleQuota, value: number): number;
}

export class FlaggedRewardRuleQuotaAdjuster implements RewardRuleQuotaFactor {
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

  adjust(item: RewardRuleQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RewardRuleQuotaWindowDaysOffsetAdjuster implements RewardRuleQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RewardRuleQuota, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class TieredRewardRuleQuotaAdjuster implements RewardRuleQuotaFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceRewardRuleQuotaAdjuster implements RewardRuleQuotaFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RewardRuleQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRewardRuleQuotaAdjuster implements RewardRuleQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRewardRuleQuotaAdjuster implements RewardRuleQuotaFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule quota steps in order and keeps a trace of each. */
export class RewardRuleQuotaEngine {
  steps: RewardRuleQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleQuota): number {
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

  evaluateAll(items: RewardRuleQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleQuotaEngine(flagsValue: flags.Registry): RewardRuleQuotaEngine {
  return new RewardRuleQuotaEngine(
    [
      new FlaggedRewardRuleQuotaAdjuster(flagsValue, "reward-rule-quota-primary", -2.5),
      new RewardRuleQuotaWindowDaysOffsetAdjuster(0.33),
      new TieredRewardRuleQuotaAdjuster([5502, 8941, 9373], [1.12, 0.89, 0.81]),
      new UtmSourceRewardRuleQuotaAdjuster(new Map<string, number>([["south", 1.19], ["west", 0.84]])),
      new RoundingRewardRuleQuotaAdjuster(0.5),
      new PercentRewardRuleQuotaAdjuster(15.6),
    ],
    [],
    4.2,
    62680.3,
  );
}
