import * as flags from "../../../../kit/flags.js";
import { LeaderboardBudget } from "./leaderboard-budget.js";

/** One step of the leaderboard budget calculation. */
export interface LeaderboardBudgetStep {
  describe(): string;
  adjust(item: LeaderboardBudget, value: number): number;
}

export class LocaleLeaderboardBudgetAdjuster implements LeaderboardBudgetStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LeaderboardBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLeaderboardBudgetAdjuster implements LeaderboardBudgetStep {
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

  adjust(item: LeaderboardBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLeaderboardBudgetAdjuster implements LeaderboardBudgetStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLeaderboardBudgetAdjuster implements LeaderboardBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the leaderboard budget steps in order and keeps a trace of each. */
export class LeaderboardBudgetEngine {
  steps: LeaderboardBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardBudget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LeaderboardBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardBudgetEngine(flagsValue: flags.Registry): LeaderboardBudgetEngine {
  return new LeaderboardBudgetEngine(
    [
      new LocaleLeaderboardBudgetAdjuster(
        new Map<string, number>([["east", 1.33], ["west", 1.14], ["online", 1.27]]),
      ),
      new FlaggedLeaderboardBudgetAdjuster(flagsValue, "leaderboard-budget-capped", 0.4),
      new PercentLeaderboardBudgetAdjuster(3.4),
      new CapLeaderboardBudgetAdjuster(6118),
    ],
    [],
    0.3,
    33027.3,
  );
}
