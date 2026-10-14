import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardAdjustment } from "./leaderboard-adjustment.js";

/** One step of the leaderboard adjustment calculation. */
export interface LeaderboardAdjustmentStep {
  describe(): string;
  adjust(item: LeaderboardAdjustment, value: number): number;
}

export class RoundingLeaderboardAdjustmentAdjuster implements LeaderboardAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLeaderboardAdjustmentAdjuster implements LeaderboardAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLeaderboardAdjustmentAdjuster implements LeaderboardAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLeaderboardAdjustmentAdjuster implements LeaderboardAdjustmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLeaderboardAdjustmentAdjuster implements LeaderboardAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the leaderboard adjustment steps in order and keeps a trace of each. */
export class LeaderboardAdjustmentEngine {
  steps: LeaderboardAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LeaderboardAdjustment): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: LeaderboardAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLeaderboardAdjustmentEngine(): LeaderboardAdjustmentEngine {
  return new LeaderboardAdjustmentEngine(
    [
      new RoundingLeaderboardAdjustmentAdjuster(1),
      new MinimumLeaderboardAdjustmentAdjuster(42.9),
      new LabelLeaderboardAdjustmentAdjuster(new Map<string, number>([["online", 0.74]])),
      new TieredLeaderboardAdjustmentAdjuster([1750, 8060], [1.17, 0.92]),
      new PercentLeaderboardAdjustmentAdjuster(23.5),
    ],
    [],
    4,
    20733.9,
  );
}
