import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardPolicy } from "./leaderboard-policy.js";

/** One step of the leaderboard policy calculation. */
export interface LeaderboardPolicyAdjuster {
  describe(): string;
  adjust(item: LeaderboardPolicy, value: number): number;
}

export class MinimumLeaderboardPolicyAdjuster implements LeaderboardPolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LeaderboardPolicyRatioOffsetAdjuster implements LeaderboardPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: LeaderboardPolicy, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class PercentLeaderboardPolicyAdjuster implements LeaderboardPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLeaderboardPolicyAdjuster implements LeaderboardPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLeaderboardPolicyAdjuster implements LeaderboardPolicyAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentLeaderboardPolicyAdjuster implements LeaderboardPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LeaderboardPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the leaderboard policy steps in order and keeps a trace of each. */
export class LeaderboardPolicyEngine {
  steps: LeaderboardPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardPolicy): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LeaderboardPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardPolicyEngine(): LeaderboardPolicyEngine {
  return new LeaderboardPolicyEngine(
    [
      new MinimumLeaderboardPolicyAdjuster(45.8),
      new LeaderboardPolicyRatioOffsetAdjuster(1.55),
      new PercentLeaderboardPolicyAdjuster(24.8),
      new TieredLeaderboardPolicyAdjuster([6481, 6720], [0.92, 0.95]),
      new RoundingLeaderboardPolicyAdjuster(0.1),
      new SegmentLeaderboardPolicyAdjuster(
        new Map<string, number>([["central", 0.98], ["east", 0.83], ["online", 1.16]]),
      ),
    ],
    [],
    1.8,
    43827.5,
  );
}
