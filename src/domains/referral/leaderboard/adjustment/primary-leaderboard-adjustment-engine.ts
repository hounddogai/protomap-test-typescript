import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryLeaderboardAdjustment } from "./primary-leaderboard-adjustment.js";

/** One step of the primary leaderboard adjustment calculation. */
export interface PrimaryLeaderboardAdjustmentAdjuster {
  describe(): string;
  adjust(item: PrimaryLeaderboardAdjustment, value: number): number;
}

export class TieredPrimaryLeaderboardAdjustmentAdjuster implements PrimaryLeaderboardAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryLeaderboardAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPrimaryLeaderboardAdjustmentAdjuster implements PrimaryLeaderboardAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryLeaderboardAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NamePrimaryLeaderboardAdjustmentAdjuster implements PrimaryLeaderboardAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryLeaderboardAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PrimaryLeaderboardAdjustmentThresholdOffsetAdjuster implements PrimaryLeaderboardAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PrimaryLeaderboardAdjustment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedPrimaryLeaderboardAdjustmentAdjuster implements PrimaryLeaderboardAdjustmentAdjuster {
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

  adjust(item: PrimaryLeaderboardAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentPrimaryLeaderboardAdjustmentAdjuster implements PrimaryLeaderboardAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryLeaderboardAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary leaderboard adjustment steps in order and keeps a trace of each. */
export class PrimaryLeaderboardAdjustmentEngine {
  steps: PrimaryLeaderboardAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryLeaderboardAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryLeaderboardAdjustment): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PrimaryLeaderboardAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryLeaderboardAdjustmentEngine(flagsValue: flags.Registry): PrimaryLeaderboardAdjustmentEngine {
  return new PrimaryLeaderboardAdjustmentEngine(
    [
      new TieredPrimaryLeaderboardAdjustmentAdjuster([3855, 5997, 6920], [0.84, 1, 0.97]),
      new MinimumPrimaryLeaderboardAdjustmentAdjuster(9.3),
      new NamePrimaryLeaderboardAdjustmentAdjuster(
        new Map<string, number>([["retail", 1.1], ["south", 0.93], ["west", 0.72]]),
      ),
      new PrimaryLeaderboardAdjustmentThresholdOffsetAdjuster(0.3),
      new FlaggedPrimaryLeaderboardAdjustmentAdjuster(
        flagsValue,
        "primary-leaderboard-adjustment-seasonal",
        5.2,
      ),
      new PercentPrimaryLeaderboardAdjustmentAdjuster(24),
    ],
    [],
    1.6,
    28704.9,
  );
}
