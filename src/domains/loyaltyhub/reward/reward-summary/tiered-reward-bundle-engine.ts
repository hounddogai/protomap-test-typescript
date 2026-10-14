import * as numbers from "../../../../kit/numbers.js";
import { TieredRewardBundle } from "./tiered-reward-bundle.js";

/** One step of the tiered reward bundle calculation. */
export interface TieredRewardBundleModifier {
  describe(): string;
  adjust(item: TieredRewardBundle, value: number): number;
}

export class MinimumTieredRewardBundleAdjuster implements TieredRewardBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredRewardBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredRewardBundleAdjuster implements TieredRewardBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredRewardBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredRewardBundleAdjuster implements TieredRewardBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredRewardBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredRewardBundleAdjuster implements TieredRewardBundleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredRewardBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredRewardBundleAdjuster implements TieredRewardBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredRewardBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryTieredRewardBundleAdjuster implements TieredRewardBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredRewardBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered reward bundle steps in order and keeps a trace of each. */
export class TieredRewardBundleEngine {
  steps: TieredRewardBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredRewardBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredRewardBundle): number {
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

  evaluateAll(items: TieredRewardBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredRewardBundleEngine(): TieredRewardBundleEngine {
  return new TieredRewardBundleEngine(
    [
      new MinimumTieredRewardBundleAdjuster(21.8),
      new CapTieredRewardBundleAdjuster(25987),
      new RoundingTieredRewardBundleAdjuster(0.05),
      new PercentTieredRewardBundleAdjuster(23.5),
      new TieredTieredRewardBundleAdjuster([5550, 6082], [0.95, 0.81]),
      new CategoryTieredRewardBundleAdjuster(new Map<string, number>([["west", 0.73], ["central", 0.76]])),
    ],
    [],
    1.4,
    61082.2,
  );
}
