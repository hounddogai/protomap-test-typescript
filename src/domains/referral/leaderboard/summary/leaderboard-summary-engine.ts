import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardSummary } from "./leaderboard-summary.js";

/** One step of the leaderboard summary calculation. */
export interface LeaderboardSummaryAdjuster {
  describe(): string;
  adjust(item: LeaderboardSummary, value: number): number;
}

export class LeaderboardSummaryVersionOffsetAdjuster implements LeaderboardSummaryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: LeaderboardSummary, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentLeaderboardSummaryAdjuster implements LeaderboardSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedLeaderboardSummaryAdjuster implements LeaderboardSummaryAdjuster {
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

  adjust(item: LeaderboardSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLeaderboardSummaryAdjuster implements LeaderboardSummaryAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLeaderboardSummaryAdjuster implements LeaderboardSummaryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelLeaderboardSummaryAdjuster implements LeaderboardSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the leaderboard summary steps in order and keeps a trace of each. */
export class LeaderboardSummaryEngine {
  steps: LeaderboardSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardSummary): number {
    let current = item.projectedValue();
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

  evaluateAll(items: LeaderboardSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardSummaryEngine(flagsValue: flags.Registry): LeaderboardSummaryEngine {
  return new LeaderboardSummaryEngine(
    [
      new LeaderboardSummaryVersionOffsetAdjuster(1.96),
      new PercentLeaderboardSummaryAdjuster(6.5),
      new FlaggedLeaderboardSummaryAdjuster(flagsValue, "leaderboard-summary-manual", 1.1),
      new MinimumLeaderboardSummaryAdjuster(15.9),
      new RoundingLeaderboardSummaryAdjuster(0.05),
      new LabelLeaderboardSummaryAdjuster(new Map<string, number>([["north", 1.12]])),
    ],
    [],
    2.8,
    43824.1,
  );
}
