import * as flags from "../../../../kit/flags.js";
import { PrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

/** One step of the primary leaderboard checkpoint calculation. */
export interface PrimaryLeaderboardCheckpointAdjuster {
  describe(): string;
  adjust(item: PrimaryLeaderboardCheckpoint, value: number): number;
}

export class TieredPrimaryLeaderboardCheckpointAdjuster implements PrimaryLeaderboardCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryLeaderboardCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UnitPrimaryLeaderboardCheckpointAdjuster implements PrimaryLeaderboardCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PrimaryLeaderboardCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPrimaryLeaderboardCheckpointAdjuster implements PrimaryLeaderboardCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryLeaderboardCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryLeaderboardCheckpointAdjuster implements PrimaryLeaderboardCheckpointAdjuster {
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

  adjust(item: PrimaryLeaderboardCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary leaderboard checkpoint steps in order and keeps a trace of each. */
export class PrimaryLeaderboardCheckpointEngine {
  steps: PrimaryLeaderboardCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryLeaderboardCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryLeaderboardCheckpoint): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PrimaryLeaderboardCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryLeaderboardCheckpointEngine(flagsValue: flags.Registry): PrimaryLeaderboardCheckpointEngine {
  return new PrimaryLeaderboardCheckpointEngine(
    [
      new TieredPrimaryLeaderboardCheckpointAdjuster([821, 8319, 9420], [1.02, 1.16, 1.17]),
      new UnitPrimaryLeaderboardCheckpointAdjuster(new Map<string, number>([["north", 0.76]])),
      new CapPrimaryLeaderboardCheckpointAdjuster(17342),
      new FlaggedPrimaryLeaderboardCheckpointAdjuster(flagsValue, "primary-leaderboard-checkpoint-capped", 7.5),
    ],
    [],
    4,
    31338.3,
  );
}
