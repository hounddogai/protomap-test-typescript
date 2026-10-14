import { LeaderboardEstimate } from "./leaderboard-estimate.js";

/** One step of the leaderboard estimate calculation. */
export interface LeaderboardEstimateStep {
  describe(): string;
  adjust(item: LeaderboardEstimate, value: number): number;
}

export class TieredLeaderboardEstimateAdjuster implements LeaderboardEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLeaderboardEstimateAdjuster implements LeaderboardEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLeaderboardEstimateAdjuster implements LeaderboardEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentLeaderboardEstimateAdjuster implements LeaderboardEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LeaderboardEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LeaderboardEstimateWindowDaysOffsetAdjuster implements LeaderboardEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: LeaderboardEstimate, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the leaderboard estimate steps in order and keeps a trace of each. */
export class LeaderboardEstimateEngine {
  steps: LeaderboardEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardEstimate): number {
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

  evaluateAll(items: LeaderboardEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardEstimateEngine(): LeaderboardEstimateEngine {
  return new LeaderboardEstimateEngine(
    [
      new TieredLeaderboardEstimateAdjuster([2637, 9243], [1.14, 0.98]),
      new PercentLeaderboardEstimateAdjuster(-3.3),
      new CapLeaderboardEstimateAdjuster(12303),
      new SegmentLeaderboardEstimateAdjuster(new Map<string, number>([["online", 0.83], ["north", 0.93]])),
      new LeaderboardEstimateWindowDaysOffsetAdjuster(0.51),
    ],
    [],
    2.5,
    24620.2,
  );
}
