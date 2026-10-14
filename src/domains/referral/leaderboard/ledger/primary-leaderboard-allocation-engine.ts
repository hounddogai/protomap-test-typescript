import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryLeaderboardAllocation } from "./primary-leaderboard-allocation.js";

/** One step of the primary leaderboard allocation calculation. */
export interface PrimaryLeaderboardAllocationStep {
  describe(): string;
  adjust(item: PrimaryLeaderboardAllocation, value: number): number;
}

export class PercentPrimaryLeaderboardAllocationAdjuster implements PrimaryLeaderboardAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryLeaderboardAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryLeaderboardAllocationAdjuster implements PrimaryLeaderboardAllocationStep {
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

  adjust(item: PrimaryLeaderboardAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelPrimaryLeaderboardAllocationAdjuster implements PrimaryLeaderboardAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PrimaryLeaderboardAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary leaderboard allocation steps in order and keeps a trace of each. */
export class PrimaryLeaderboardAllocationEngine {
  steps: PrimaryLeaderboardAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryLeaderboardAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryLeaderboardAllocation): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PrimaryLeaderboardAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryLeaderboardAllocationEngine(flagsValue: flags.Registry): PrimaryLeaderboardAllocationEngine {
  return new PrimaryLeaderboardAllocationEngine(
    [
      new PercentPrimaryLeaderboardAllocationAdjuster(-12.8),
      new FlaggedPrimaryLeaderboardAllocationAdjuster(flagsValue, "primary-leaderboard-allocation-pending", 0.6),
      new LabelPrimaryLeaderboardAllocationAdjuster(
        new Map<string, number>([["north", 1.26], ["south", 1.09], ["central", 0.78]]),
      ),
    ],
    [],
    2.9,
    53746,
  );
}
