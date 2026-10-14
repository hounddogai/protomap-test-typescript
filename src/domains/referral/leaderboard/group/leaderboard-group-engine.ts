import * as flags from "../../../../kit/flags.js";
import { LeaderboardGroup } from "./leaderboard-group.js";

/** One step of the leaderboard group calculation. */
export interface LeaderboardGroupAdjuster {
  describe(): string;
  adjust(item: LeaderboardGroup, value: number): number;
}

export class TieredLeaderboardGroupAdjuster implements LeaderboardGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLeaderboardGroupAdjuster implements LeaderboardGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelLeaderboardGroupAdjuster implements LeaderboardGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLeaderboardGroupAdjuster implements LeaderboardGroupAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLeaderboardGroupAdjuster implements LeaderboardGroupAdjuster {
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

  adjust(item: LeaderboardGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the leaderboard group steps in order and keeps a trace of each. */
export class LeaderboardGroupEngine {
  steps: LeaderboardGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardGroup): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: LeaderboardGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardGroupEngine(flagsValue: flags.Registry): LeaderboardGroupEngine {
  return new LeaderboardGroupEngine(
    [
      new TieredLeaderboardGroupAdjuster([1512, 2498, 5078, 7091], [1.03, 0.97, 0.93, 0.92]),
      new PercentLeaderboardGroupAdjuster(20.1),
      new LabelLeaderboardGroupAdjuster(new Map<string, number>([["online", 1.24], ["north", 1.06]])),
      new MinimumLeaderboardGroupAdjuster(28.5),
      new FlaggedLeaderboardGroupAdjuster(flagsValue, "leaderboard-group-strict", 0.8),
    ],
    [],
    2.6,
    45169.4,
  );
}
