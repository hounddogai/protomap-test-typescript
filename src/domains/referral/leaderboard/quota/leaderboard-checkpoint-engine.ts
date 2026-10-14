import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardCheckpoint } from "./leaderboard-checkpoint.js";

/** One step of the leaderboard checkpoint calculation. */
export interface LeaderboardCheckpointStep {
  describe(): string;
  adjust(item: LeaderboardCheckpoint, value: number): number;
}

export class PercentLeaderboardCheckpointAdjuster implements LeaderboardCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLeaderboardCheckpointAdjuster implements LeaderboardCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapLeaderboardCheckpointAdjuster implements LeaderboardCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the leaderboard checkpoint steps in order and keeps a trace of each. */
export class LeaderboardCheckpointEngine {
  steps: LeaderboardCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardCheckpoint): number {
    let current = item.netLoad();
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

  evaluateAll(items: LeaderboardCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardCheckpointEngine(): LeaderboardCheckpointEngine {
  return new LeaderboardCheckpointEngine(
    [
      new PercentLeaderboardCheckpointAdjuster(21),
      new RoundingLeaderboardCheckpointAdjuster(5),
      new CapLeaderboardCheckpointAdjuster(27354),
    ],
    [],
    0.4,
    88384.7,
  );
}
