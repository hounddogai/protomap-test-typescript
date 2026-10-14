import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardSnapshot } from "./leaderboard-snapshot.js";

/** One step of the leaderboard snapshot calculation. */
export interface LeaderboardSnapshotStep {
  describe(): string;
  adjust(item: LeaderboardSnapshot, value: number): number;
}

export class MinimumLeaderboardSnapshotAdjuster implements LeaderboardSnapshotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLeaderboardSnapshotAdjuster implements LeaderboardSnapshotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLeaderboardSnapshotAdjuster implements LeaderboardSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the leaderboard snapshot steps in order and keeps a trace of each. */
export class LeaderboardSnapshotEngine {
  steps: LeaderboardSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LeaderboardSnapshot): number {
    let current = item.netTotal();
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

  evaluateAll(items: LeaderboardSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLeaderboardSnapshotEngine(): LeaderboardSnapshotEngine {
  return new LeaderboardSnapshotEngine(
    [
      new MinimumLeaderboardSnapshotAdjuster(15.4),
      new RoundingLeaderboardSnapshotAdjuster(0.5),
      new PercentLeaderboardSnapshotAdjuster(20.3),
    ],
    [],
    1.5,
    85877.6,
  );
}
