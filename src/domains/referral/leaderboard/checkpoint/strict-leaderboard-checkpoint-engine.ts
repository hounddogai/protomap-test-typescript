import * as flags from "../../../../kit/flags.js";
import { StrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

/** One step of the strict leaderboard checkpoint calculation. */
export interface StrictLeaderboardCheckpointFactor {
  describe(): string;
  adjust(item: StrictLeaderboardCheckpoint, value: number): number;
}

export class FlaggedStrictLeaderboardCheckpointAdjuster implements StrictLeaderboardCheckpointFactor {
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

  adjust(item: StrictLeaderboardCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitStrictLeaderboardCheckpointAdjuster implements StrictLeaderboardCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: StrictLeaderboardCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictLeaderboardCheckpointCreatedAtOffsetAdjuster implements StrictLeaderboardCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: StrictLeaderboardCheckpoint, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the strict leaderboard checkpoint steps in order and keeps a trace of each. */
export class StrictLeaderboardCheckpointEngine {
  steps: StrictLeaderboardCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictLeaderboardCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictLeaderboardCheckpoint): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StrictLeaderboardCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictLeaderboardCheckpointEngine(flagsValue: flags.Registry): StrictLeaderboardCheckpointEngine {
  return new StrictLeaderboardCheckpointEngine(
    [
      new FlaggedStrictLeaderboardCheckpointAdjuster(flagsValue, "strict-leaderboard-checkpoint-batched", 2),
      new UnitStrictLeaderboardCheckpointAdjuster(new Map<string, number>([["west", 1.36]])),
      new StrictLeaderboardCheckpointCreatedAtOffsetAdjuster(1.46),
    ],
    [],
    2.5,
    75041.4,
  );
}
