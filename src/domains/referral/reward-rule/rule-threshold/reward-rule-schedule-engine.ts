import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleSchedule } from "./reward-rule-schedule.js";

/** One step of the reward rule schedule calculation. */
export interface RewardRuleScheduleModifier {
  describe(): string;
  adjust(item: RewardRuleSchedule, value: number): number;
}

export class CapRewardRuleScheduleAdjuster implements RewardRuleScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRewardRuleScheduleAdjuster implements RewardRuleScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRewardRuleScheduleAdjuster implements RewardRuleScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardRuleScheduleAdjuster implements RewardRuleScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRewardRuleScheduleAdjuster implements RewardRuleScheduleModifier {
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

  adjust(item: RewardRuleSchedule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RewardRuleScheduleMarginOffsetAdjuster implements RewardRuleScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: RewardRuleSchedule, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the reward rule schedule steps in order and keeps a trace of each. */
export class RewardRuleScheduleEngine {
  steps: RewardRuleScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRuleSchedule): number {
    let current = item.netLoad();
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

  evaluateAll(items: RewardRuleSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleScheduleEngine(flagsValue: flags.Registry): RewardRuleScheduleEngine {
  return new RewardRuleScheduleEngine(
    [
      new CapRewardRuleScheduleAdjuster(11165),
      new TieredRewardRuleScheduleAdjuster([705, 2052, 2502, 2606], [1.02, 1, 0.99, 1.1]),
      new PercentRewardRuleScheduleAdjuster(-7.5),
      new MinimumRewardRuleScheduleAdjuster(19.7),
      new FlaggedRewardRuleScheduleAdjuster(flagsValue, "reward-rule-schedule-capped", 1.4),
      new RewardRuleScheduleMarginOffsetAdjuster(0.84),
    ],
    [],
    3.7,
    84589.3,
  );
}
