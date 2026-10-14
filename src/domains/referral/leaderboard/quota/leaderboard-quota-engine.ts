import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardQuota } from "./leaderboard-quota.js";

/** One step of the leaderboard quota calculation. */
export interface LeaderboardQuotaAdjuster {
  describe(): string;
  adjust(item: LeaderboardQuota, value: number): number;
}

export class LeaderboardQuotaFloorValueOffsetAdjuster implements LeaderboardQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: LeaderboardQuota, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class FlaggedLeaderboardQuotaAdjuster implements LeaderboardQuotaAdjuster {
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

  adjust(item: LeaderboardQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLeaderboardQuotaAdjuster implements LeaderboardQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLeaderboardQuotaAdjuster implements LeaderboardQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentLeaderboardQuotaAdjuster implements LeaderboardQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LeaderboardQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLeaderboardQuotaAdjuster implements LeaderboardQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the leaderboard quota steps in order and keeps a trace of each. */
export class LeaderboardQuotaEngine {
  steps: LeaderboardQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LeaderboardQuota): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LeaderboardQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLeaderboardQuotaEngine(flagsValue: flags.Registry): LeaderboardQuotaEngine {
  return new LeaderboardQuotaEngine(
    [
      new LeaderboardQuotaFloorValueOffsetAdjuster(0.57),
      new FlaggedLeaderboardQuotaAdjuster(flagsValue, "leaderboard-quota-primary", -5.5),
      new MinimumLeaderboardQuotaAdjuster(34.9),
      new CapLeaderboardQuotaAdjuster(32482),
      new SegmentLeaderboardQuotaAdjuster(new Map<string, number>([["online", 0.83], ["retail", 1.11]])),
      new TieredLeaderboardQuotaAdjuster([474, 3081, 5479], [1, 0.85, 0.81]),
    ],
    [],
    3.9,
    43586.3,
  );
}
