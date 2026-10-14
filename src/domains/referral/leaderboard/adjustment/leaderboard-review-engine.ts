import { LeaderboardReview } from "./leaderboard-review.js";

/** One step of the leaderboard review calculation. */
export interface LeaderboardReviewModifier {
  describe(): string;
  adjust(item: LeaderboardReview, value: number): number;
}

export class TieredLeaderboardReviewAdjuster implements LeaderboardReviewModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardReview, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLeaderboardReviewAdjuster implements LeaderboardReviewModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardReview, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LeaderboardReviewWeightOffsetAdjuster implements LeaderboardReviewModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: LeaderboardReview, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class CapLeaderboardReviewAdjuster implements LeaderboardReviewModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardReview, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the leaderboard review steps in order and keeps a trace of each. */
export class LeaderboardReviewEngine {
  steps: LeaderboardReviewModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardReviewModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardReview): number {
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

  evaluateAll(items: LeaderboardReview[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardReviewEngine(): LeaderboardReviewEngine {
  return new LeaderboardReviewEngine(
    [
      new TieredLeaderboardReviewAdjuster([234, 2881, 4703, 4981], [0.98, 0.95, 0.93, 1.1]),
      new MinimumLeaderboardReviewAdjuster(49.1),
      new LeaderboardReviewWeightOffsetAdjuster(0.24),
      new CapLeaderboardReviewAdjuster(12985),
    ],
    [],
    4,
    38540.9,
  );
}
