import * as flags from "../../../../kit/flags.js";
import { LeaderboardManifest } from "./leaderboard-manifest.js";

/** One step of the leaderboard manifest calculation. */
export interface LeaderboardManifestStep {
  describe(): string;
  adjust(item: LeaderboardManifest, value: number): number;
}

export class TieredLeaderboardManifestAdjuster implements LeaderboardManifestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLeaderboardManifestAdjuster implements LeaderboardManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryLeaderboardManifestAdjuster implements LeaderboardManifestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LeaderboardManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLeaderboardManifestAdjuster implements LeaderboardManifestStep {
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

  adjust(item: LeaderboardManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLeaderboardManifestAdjuster implements LeaderboardManifestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LeaderboardManifestVersionOffsetAdjuster implements LeaderboardManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: LeaderboardManifest, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the leaderboard manifest steps in order and keeps a trace of each. */
export class LeaderboardManifestEngine {
  steps: LeaderboardManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LeaderboardManifest): number {
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

  evaluateAll(items: LeaderboardManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLeaderboardManifestEngine(flagsValue: flags.Registry): LeaderboardManifestEngine {
  return new LeaderboardManifestEngine(
    [
      new TieredLeaderboardManifestAdjuster([50, 1553, 4959], [0.81, 0.87, 1.11]),
      new CapLeaderboardManifestAdjuster(20827),
      new CategoryLeaderboardManifestAdjuster(
        new Map<string, number>([["retail", 1.37], ["online", 0.73], ["north", 1.02]]),
      ),
      new FlaggedLeaderboardManifestAdjuster(flagsValue, "leaderboard-manifest-legacy", 7.9),
      new PercentLeaderboardManifestAdjuster(-0.9),
      new LeaderboardManifestVersionOffsetAdjuster(0.83),
    ],
    [],
    0.3,
    91427.6,
  );
}
