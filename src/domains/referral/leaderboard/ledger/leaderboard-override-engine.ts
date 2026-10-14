import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardOverride } from "./leaderboard-override.js";

/** One step of the leaderboard override calculation. */
export interface LeaderboardOverrideFactor {
  describe(): string;
  adjust(item: LeaderboardOverride, value: number): number;
}

export class RoundingLeaderboardOverrideAdjuster implements LeaderboardOverrideFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelLeaderboardOverrideAdjuster implements LeaderboardOverrideFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLeaderboardOverrideAdjuster implements LeaderboardOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLeaderboardOverrideAdjuster implements LeaderboardOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLeaderboardOverrideAdjuster implements LeaderboardOverrideFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LeaderboardOverrideGraceDaysOffsetAdjuster implements LeaderboardOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: LeaderboardOverride, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the leaderboard override steps in order and keeps a trace of each. */
export class LeaderboardOverrideEngine {
  steps: LeaderboardOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardOverride): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: LeaderboardOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardOverrideEngine(): LeaderboardOverrideEngine {
  return new LeaderboardOverrideEngine(
    [
      new RoundingLeaderboardOverrideAdjuster(0.5),
      new LabelLeaderboardOverrideAdjuster(new Map<string, number>([["central", 1.02], ["retail", 1.08]])),
      new TieredLeaderboardOverrideAdjuster([1206, 3534, 7196], [1.04, 0.88, 1.19]),
      new MinimumLeaderboardOverrideAdjuster(44.8),
      new PercentLeaderboardOverrideAdjuster(-6.8),
      new LeaderboardOverrideGraceDaysOffsetAdjuster(1.06),
    ],
    [],
    1,
    23083,
  );
}
