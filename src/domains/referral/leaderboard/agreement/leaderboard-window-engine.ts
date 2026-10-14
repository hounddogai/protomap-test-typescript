import { LeaderboardWindow } from "./leaderboard-window.js";

/** One step of the leaderboard window calculation. */
export interface LeaderboardWindowStep {
  describe(): string;
  adjust(item: LeaderboardWindow, value: number): number;
}

export class PercentLeaderboardWindowAdjuster implements LeaderboardWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLeaderboardWindowAdjuster implements LeaderboardWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LeaderboardWindowClicksOffsetAdjuster implements LeaderboardWindowStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: LeaderboardWindow, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class CapLeaderboardWindowAdjuster implements LeaderboardWindowStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the leaderboard window steps in order and keeps a trace of each. */
export class LeaderboardWindowEngine {
  steps: LeaderboardWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LeaderboardWindow): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: LeaderboardWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLeaderboardWindowEngine(): LeaderboardWindowEngine {
  return new LeaderboardWindowEngine(
    [
      new PercentLeaderboardWindowAdjuster(23.3),
      new TieredLeaderboardWindowAdjuster([1763, 5698, 6430, 8927], [0.95, 0.94, 1.18, 1.18]),
      new LeaderboardWindowClicksOffsetAdjuster(1.66),
      new CapLeaderboardWindowAdjuster(44562),
    ],
    [],
    4.7,
    9787.5,
  );
}
