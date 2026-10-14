import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LeaderboardAllocation } from "./leaderboard-allocation.js";

/** One step of the leaderboard allocation calculation. */
export interface LeaderboardAllocationModifier {
  describe(): string;
  adjust(item: LeaderboardAllocation, value: number): number;
}

export class TieredLeaderboardAllocationAdjuster implements LeaderboardAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LeaderboardAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLeaderboardAllocationAdjuster implements LeaderboardAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LeaderboardAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLeaderboardAllocationAdjuster implements LeaderboardAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LeaderboardAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryLeaderboardAllocationAdjuster implements LeaderboardAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: LeaderboardAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedLeaderboardAllocationAdjuster implements LeaderboardAllocationModifier {
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

  adjust(item: LeaderboardAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLeaderboardAllocationAdjuster implements LeaderboardAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LeaderboardAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the leaderboard allocation steps in order and keeps a trace of each. */
export class LeaderboardAllocationEngine {
  steps: LeaderboardAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LeaderboardAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LeaderboardAllocation): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LeaderboardAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLeaderboardAllocationEngine(flagsValue: flags.Registry): LeaderboardAllocationEngine {
  return new LeaderboardAllocationEngine(
    [
      new TieredLeaderboardAllocationAdjuster([519, 2685, 5764, 5966], [1.06, 1.03, 0.86, 1.07]),
      new MinimumLeaderboardAllocationAdjuster(49.6),
      new RoundingLeaderboardAllocationAdjuster(0.25),
      new CategoryLeaderboardAllocationAdjuster(new Map<string, number>([["online", 1.35]])),
      new FlaggedLeaderboardAllocationAdjuster(flagsValue, "leaderboard-allocation-fallback", 9.6),
      new CapLeaderboardAllocationAdjuster(14775),
    ],
    [],
    1.4,
    75568.4,
  );
}
