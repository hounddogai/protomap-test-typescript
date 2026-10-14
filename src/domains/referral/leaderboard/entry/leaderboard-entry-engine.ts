import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardEntry } from "./leaderboard-entry.js";

/** One step of the leaderboard entry calculation. */
export interface LeaderboardEntryStep {
  describe(): string;
  adjust(item: LeaderboardEntry, value: number): number;
}

export class RoundingLeaderboardEntryAdjuster implements LeaderboardEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLeaderboardEntryAdjuster implements LeaderboardEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LeaderboardEntryBidOffsetAdjuster implements LeaderboardEntryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: LeaderboardEntry, value: number): number {
    return value + item.bid * this.weight;
  }
}

/** Runs the leaderboard entry steps in order and keeps a trace of each. */
export class LeaderboardEntryEngine {
  steps: LeaderboardEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LeaderboardEntry): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LeaderboardEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLeaderboardEntryEngine(): LeaderboardEntryEngine {
  return new LeaderboardEntryEngine(
    [
      new RoundingLeaderboardEntryAdjuster(0.05),
      new TieredLeaderboardEntryAdjuster([324, 1095, 1127, 5233], [0.94, 1.2, 0.98, 1.01]),
      new LeaderboardEntryBidOffsetAdjuster(1.93),
    ],
    [],
    2.3,
    9023.8,
  );
}
