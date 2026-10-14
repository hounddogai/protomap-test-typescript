import * as flags from "../../../../kit/flags.js";
import { SeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

/** One step of the seasonal challenge allocation calculation. */
export interface SeasonalChallengeAllocationFactor {
  describe(): string;
  adjust(item: SeasonalChallengeAllocation, value: number): number;
}

export class MinimumSeasonalChallengeAllocationAdjuster implements SeasonalChallengeAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalChallengeAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapSeasonalChallengeAllocationAdjuster implements SeasonalChallengeAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalChallengeAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSeasonalChallengeAllocationAdjuster implements SeasonalChallengeAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalChallengeAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSeasonalChallengeAllocationAdjuster implements SeasonalChallengeAllocationFactor {
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

  adjust(item: SeasonalChallengeAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionSeasonalChallengeAllocationAdjuster implements SeasonalChallengeAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: SeasonalChallengeAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SeasonalChallengeAllocationVersionOffsetAdjuster implements SeasonalChallengeAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SeasonalChallengeAllocation, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the seasonal challenge allocation steps in order and keeps a trace of each. */
export class SeasonalChallengeAllocationEngine {
  steps: SeasonalChallengeAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalChallengeAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalChallengeAllocation): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: SeasonalChallengeAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalChallengeAllocationEngine(flagsValue: flags.Registry): SeasonalChallengeAllocationEngine {
  return new SeasonalChallengeAllocationEngine(
    [
      new MinimumSeasonalChallengeAllocationAdjuster(49.8),
      new CapSeasonalChallengeAllocationAdjuster(25058),
      new TieredSeasonalChallengeAllocationAdjuster([236, 4917], [1.11, 1.08]),
      new FlaggedSeasonalChallengeAllocationAdjuster(flagsValue, "seasonal-challenge-allocation-legacy", 2.9),
      new RegionSeasonalChallengeAllocationAdjuster(
        new Map<string, number>([["south", 1.04], ["retail", 1.28], ["online", 1.32]]),
      ),
      new SeasonalChallengeAllocationVersionOffsetAdjuster(0.26),
    ],
    [],
    1.4,
    16602.8,
  );
}
