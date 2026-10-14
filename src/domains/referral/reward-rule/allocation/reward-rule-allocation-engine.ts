import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleAllocation } from "./reward-rule-allocation.js";

/** One step of the reward rule allocation calculation. */
export interface RewardRuleAllocationModifier {
  describe(): string;
  adjust(item: RewardRuleAllocation, value: number): number;
}

export class FlaggedRewardRuleAllocationAdjuster implements RewardRuleAllocationModifier {
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

  adjust(item: RewardRuleAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardRuleAllocationAdjuster implements RewardRuleAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRewardRuleAllocationAdjuster implements RewardRuleAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryRewardRuleAllocationAdjuster implements RewardRuleAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RewardRuleAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RewardRuleAllocationConversionRateOffsetAdjuster implements RewardRuleAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: RewardRuleAllocation, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the reward rule allocation steps in order and keeps a trace of each. */
export class RewardRuleAllocationEngine {
  steps: RewardRuleAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleAllocation): number {
    let current = item.netValue();
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

  evaluateAll(items: RewardRuleAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleAllocationEngine(flagsValue: flags.Registry): RewardRuleAllocationEngine {
  return new RewardRuleAllocationEngine(
    [
      new FlaggedRewardRuleAllocationAdjuster(flagsValue, "reward-rule-allocation-primary", 7.3),
      new RoundingRewardRuleAllocationAdjuster(0.1),
      new PercentRewardRuleAllocationAdjuster(5.1),
      new CountryRewardRuleAllocationAdjuster(new Map<string, number>([["retail", 0.7]])),
      new RewardRuleAllocationConversionRateOffsetAdjuster(0.11),
    ],
    [],
    1,
    13740.7,
  );
}
