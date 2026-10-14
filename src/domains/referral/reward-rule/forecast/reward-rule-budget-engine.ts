import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleBudget } from "./reward-rule-budget.js";

/** One step of the reward rule budget calculation. */
export interface RewardRuleBudgetStep {
  describe(): string;
  adjust(item: RewardRuleBudget, value: number): number;
}

export class MinimumRewardRuleBudgetAdjuster implements RewardRuleBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRewardRuleBudgetAdjuster implements RewardRuleBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRewardRuleBudgetAdjuster implements RewardRuleBudgetStep {
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

  adjust(item: RewardRuleBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RewardRuleBudgetVersionOffsetAdjuster implements RewardRuleBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RewardRuleBudget, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the reward rule budget steps in order and keeps a trace of each. */
export class RewardRuleBudgetEngine {
  steps: RewardRuleBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleBudget): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RewardRuleBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleBudgetEngine(flagsValue: flags.Registry): RewardRuleBudgetEngine {
  return new RewardRuleBudgetEngine(
    [
      new MinimumRewardRuleBudgetAdjuster(10.5),
      new CapRewardRuleBudgetAdjuster(20273),
      new FlaggedRewardRuleBudgetAdjuster(flagsValue, "reward-rule-budget-seasonal", 5.1),
      new RewardRuleBudgetVersionOffsetAdjuster(0.11),
    ],
    [],
    4.7,
    93091.2,
  );
}
