import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardBudget } from "./reward-budget.js";

/** One step of the reward budget calculation. */
export interface RewardBudgetFactor {
  describe(): string;
  adjust(item: RewardBudget, value: number): number;
}

export class FlaggedRewardBudgetAdjuster implements RewardBudgetFactor {
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

  adjust(item: RewardBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardBudgetAdjuster implements RewardBudgetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RewardBudgetFloorValueOffsetAdjuster implements RewardBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: RewardBudget, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the reward budget steps in order and keeps a trace of each. */
export class RewardBudgetEngine {
  steps: RewardBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardBudget): number {
    let current = item.weightedLoad();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RewardBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardBudgetEngine(flagsValue: flags.Registry): RewardBudgetEngine {
  return new RewardBudgetEngine(
    [
      new FlaggedRewardBudgetAdjuster(flagsValue, "reward-budget-legacy", -4.5),
      new RoundingRewardBudgetAdjuster(0.5),
      new RewardBudgetFloorValueOffsetAdjuster(0.11),
    ],
    [],
    1.9,
    39131.4,
  );
}
