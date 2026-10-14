import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardPlan } from "./reward-plan.js";

/** One step of the reward plan calculation. */
export interface RewardPlanFactor {
  describe(): string;
  adjust(item: RewardPlan, value: number): number;
}

export class RoundingRewardPlanAdjuster implements RewardPlanFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelRewardPlanAdjuster implements RewardPlanFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RewardPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RewardPlanQuantityOffsetAdjuster implements RewardPlanFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RewardPlan, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredRewardPlanAdjuster implements RewardPlanFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRewardPlanAdjuster implements RewardPlanFactor {
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

  adjust(item: RewardPlan, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardPlanAdjuster implements RewardPlanFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward plan steps in order and keeps a trace of each. */
export class RewardPlanEngine {
  steps: RewardPlanFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardPlanFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardPlan): number {
    let current = item.netVolume();
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

  evaluateAll(items: RewardPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardPlanEngine(flagsValue: flags.Registry): RewardPlanEngine {
  return new RewardPlanEngine(
    [
      new RoundingRewardPlanAdjuster(1),
      new ChannelRewardPlanAdjuster(new Map<string, number>([["central", 1.14]])),
      new RewardPlanQuantityOffsetAdjuster(0.63),
      new TieredRewardPlanAdjuster([2456, 6765], [0.81, 0.83]),
      new FlaggedRewardPlanAdjuster(flagsValue, "reward-plan-batched", 7.7),
      new MinimumRewardPlanAdjuster(13.2),
    ],
    [],
    1.2,
    83555.5,
  );
}
