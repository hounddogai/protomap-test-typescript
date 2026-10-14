import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardAssignment } from "./reward-assignment.js";

/** One step of the reward assignment calculation. */
export interface RewardAssignmentStep {
  describe(): string;
  adjust(item: RewardAssignment, value: number): number;
}

export class RoundingRewardAssignmentAdjuster implements RewardAssignmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRewardAssignmentAdjuster implements RewardAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RewardAssignmentScoreOffsetAdjuster implements RewardAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: RewardAssignment, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedRewardAssignmentAdjuster implements RewardAssignmentStep {
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

  adjust(item: RewardAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitRewardAssignmentAdjuster implements RewardAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RewardAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRewardAssignmentAdjuster implements RewardAssignmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward assignment steps in order and keeps a trace of each. */
export class RewardAssignmentEngine {
  steps: RewardAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardAssignment): number {
    let current = item.netLoad();
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

  evaluateAll(items: RewardAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardAssignmentEngine(flagsValue: flags.Registry): RewardAssignmentEngine {
  return new RewardAssignmentEngine(
    [
      new RoundingRewardAssignmentAdjuster(0.25),
      new CapRewardAssignmentAdjuster(45784),
      new RewardAssignmentScoreOffsetAdjuster(0.34),
      new FlaggedRewardAssignmentAdjuster(flagsValue, "reward-assignment-tiered", -7.7),
      new UnitRewardAssignmentAdjuster(
        new Map<string, number>([["north", 1.11], ["retail", 0.71], ["west", 1.37]]),
      ),
      new TieredRewardAssignmentAdjuster([4188, 5612, 5971, 8123], [1.14, 1.09, 0.96, 1.12]),
    ],
    [],
    3,
    29571.6,
  );
}
