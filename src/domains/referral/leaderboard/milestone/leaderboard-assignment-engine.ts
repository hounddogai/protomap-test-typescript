import * as flags from "../../../../kit/flags.js";
import { LeaderboardAssignment } from "./leaderboard-assignment.js";

/** One step of the leaderboard assignment calculation. */
export interface LeaderboardAssignmentAdjuster {
  describe(): string;
  adjust(item: LeaderboardAssignment, value: number): number;
}

export class MinimumLeaderboardAssignmentAdjuster implements LeaderboardAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLeaderboardAssignmentAdjuster implements LeaderboardAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LeaderboardAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLeaderboardAssignmentAdjuster implements LeaderboardAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLeaderboardAssignmentAdjuster implements LeaderboardAssignmentAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: LeaderboardAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LeaderboardAssignmentFrequencyCapOffsetAdjuster implements LeaderboardAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: LeaderboardAssignment, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

/** Runs the leaderboard assignment steps in order and keeps a trace of each. */
export class LeaderboardAssignmentEngine {
  steps: LeaderboardAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardAssignment): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LeaderboardAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardAssignmentEngine(flagsValue: flags.Registry): LeaderboardAssignmentEngine {
  return new LeaderboardAssignmentEngine(
    [
      new MinimumLeaderboardAssignmentAdjuster(47.3),
      new LabelLeaderboardAssignmentAdjuster(new Map<string, number>([["south", 1.04], ["east", 1.25]])),
      new TieredLeaderboardAssignmentAdjuster([1898, 5525, 5834], [0.97, 1.07, 0.81]),
      new FlaggedLeaderboardAssignmentAdjuster(flagsValue, "leaderboard-assignment-manual", -1),
      new LeaderboardAssignmentFrequencyCapOffsetAdjuster(1.82),
    ],
    [],
    1.9,
    85404,
  );
}
