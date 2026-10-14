import * as numbers from "../../../../kit/numbers.js";
import { RewardBundle } from "./reward-bundle.js";

/** One step of the reward bundle calculation. */
export interface RewardBundleModifier {
  describe(): string;
  adjust(item: RewardBundle, value: number): number;
}

export class CapRewardBundleAdjuster implements RewardBundleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceRewardBundleAdjuster implements RewardBundleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RewardBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRewardBundleAdjuster implements RewardBundleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRewardBundleAdjuster implements RewardBundleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RewardBundleCreatedAtOffsetAdjuster implements RewardBundleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: RewardBundle, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingRewardBundleAdjuster implements RewardBundleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reward bundle steps in order and keeps a trace of each. */
export class RewardBundleEngine {
  steps: RewardBundleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardBundleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardBundle): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RewardBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardBundleEngine(): RewardBundleEngine {
  return new RewardBundleEngine(
    [
      new CapRewardBundleAdjuster(40396),
      new UtmSourceRewardBundleAdjuster(
        new Map<string, number>([["south", 1.33], ["online", 0.79], ["east", 1.21]]),
      ),
      new MinimumRewardBundleAdjuster(39.1),
      new TieredRewardBundleAdjuster([5970, 8259, 9115], [0.9, 0.98, 0.91]),
      new RewardBundleCreatedAtOffsetAdjuster(0.5),
      new RoundingRewardBundleAdjuster(0.5),
    ],
    [],
    2.8,
    98900.2,
  );
}
