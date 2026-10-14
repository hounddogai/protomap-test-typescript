import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardMilestone } from "./leaderboard-milestone.js";

/** One step of the leaderboard milestone calculation. */
export interface LeaderboardMilestoneStep {
  describe(): string;
  adjust(item: LeaderboardMilestone, value: number): number;
}

export class TieredLeaderboardMilestoneAdjuster implements LeaderboardMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLeaderboardMilestoneAdjuster implements LeaderboardMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLeaderboardMilestoneAdjuster implements LeaderboardMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LeaderboardMilestoneBudgetOffsetAdjuster implements LeaderboardMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LeaderboardMilestone, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class LabelLeaderboardMilestoneAdjuster implements LeaderboardMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLeaderboardMilestoneAdjuster implements LeaderboardMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LeaderboardMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the leaderboard milestone steps in order and keeps a trace of each. */
export class LeaderboardMilestoneEngine {
  steps: LeaderboardMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LeaderboardMilestone): number {
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

  evaluateAll(items: LeaderboardMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLeaderboardMilestoneEngine(): LeaderboardMilestoneEngine {
  return new LeaderboardMilestoneEngine(
    [
      new TieredLeaderboardMilestoneAdjuster([1671, 1841, 4560, 9198], [1.19, 1.07, 0.96, 1.16]),
      new CapLeaderboardMilestoneAdjuster(21652),
      new RoundingLeaderboardMilestoneAdjuster(0.25),
      new LeaderboardMilestoneBudgetOffsetAdjuster(0.54),
      new LabelLeaderboardMilestoneAdjuster(new Map<string, number>([["central", 0.83], ["east", 1.35]])),
      new PercentLeaderboardMilestoneAdjuster(1.3),
    ],
    [],
    2.5,
    7005.3,
  );
}
