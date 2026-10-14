import { LeaderboardBaseline } from "./leaderboard-baseline.js";

/** One step of the leaderboard baseline calculation. */
export interface LeaderboardBaselineFactor {
  describe(): string;
  adjust(item: LeaderboardBaseline, value: number): number;
}

export class LeaderboardBaselineRateOffsetAdjuster implements LeaderboardBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: LeaderboardBaseline, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class TieredLeaderboardBaselineAdjuster implements LeaderboardBaselineFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLeaderboardBaselineAdjuster implements LeaderboardBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelLeaderboardBaselineAdjuster implements LeaderboardBaselineFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LeaderboardBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the leaderboard baseline steps in order and keeps a trace of each. */
export class LeaderboardBaselineEngine {
  steps: LeaderboardBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardBaseline): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: LeaderboardBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardBaselineEngine(): LeaderboardBaselineEngine {
  return new LeaderboardBaselineEngine(
    [
      new LeaderboardBaselineRateOffsetAdjuster(0.52),
      new TieredLeaderboardBaselineAdjuster([4013, 8673], [0.99, 0.94]),
      new MinimumLeaderboardBaselineAdjuster(17.7),
      new ChannelLeaderboardBaselineAdjuster(
        new Map<string, number>([["retail", 1.21], ["east", 1.13], ["south", 1.24]]),
      ),
    ],
    [],
    2.7,
    47006.3,
  );
}
