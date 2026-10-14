import * as flags from "../../../../kit/flags.js";
import { LeaderboardVariance } from "./leaderboard-variance.js";

/** One step of the leaderboard variance calculation. */
export interface LeaderboardVarianceFactor {
  describe(): string;
  adjust(item: LeaderboardVariance, value: number): number;
}

export class FlaggedLeaderboardVarianceAdjuster implements LeaderboardVarianceFactor {
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

  adjust(item: LeaderboardVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLeaderboardVarianceAdjuster implements LeaderboardVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLeaderboardVarianceAdjuster implements LeaderboardVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LeaderboardVarianceUpdatedAtOffsetAdjuster implements LeaderboardVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: LeaderboardVariance, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the leaderboard variance steps in order and keeps a trace of each. */
export class LeaderboardVarianceEngine {
  steps: LeaderboardVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardVariance): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LeaderboardVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardVarianceEngine(flagsValue: flags.Registry): LeaderboardVarianceEngine {
  return new LeaderboardVarianceEngine(
    [
      new FlaggedLeaderboardVarianceAdjuster(flagsValue, "leaderboard-variance-default", -1.3),
      new TieredLeaderboardVarianceAdjuster([6328, 7837], [1.13, 0.91]),
      new CapLeaderboardVarianceAdjuster(37643),
      new LeaderboardVarianceUpdatedAtOffsetAdjuster(1.05),
    ],
    [],
    1.5,
    61896.6,
  );
}
