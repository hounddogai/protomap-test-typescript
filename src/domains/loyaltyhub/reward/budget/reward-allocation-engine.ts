import * as numbers from "../../../../kit/numbers.js";
import { RewardAllocation } from "./reward-allocation.js";

/** One step of the reward allocation calculation. */
export interface RewardAllocationModifier {
  describe(): string;
  adjust(item: RewardAllocation, value: number): number;
}

export class RewardAllocationQuantityOffsetAdjuster implements RewardAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RewardAllocation, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class CountryRewardAllocationAdjuster implements RewardAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RewardAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRewardAllocationAdjuster implements RewardAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRewardAllocationAdjuster implements RewardAllocationModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRewardAllocationAdjuster implements RewardAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRewardAllocationAdjuster implements RewardAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward allocation steps in order and keeps a trace of each. */
export class RewardAllocationEngine {
  steps: RewardAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardAllocation): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardAllocationEngine(): RewardAllocationEngine {
  return new RewardAllocationEngine(
    [
      new RewardAllocationQuantityOffsetAdjuster(0.37),
      new CountryRewardAllocationAdjuster(new Map<string, number>([["west", 1.27]])),
      new PercentRewardAllocationAdjuster(-0.7),
      new CapRewardAllocationAdjuster(34261),
      new RoundingRewardAllocationAdjuster(1),
      new MinimumRewardAllocationAdjuster(27.6),
    ],
    [],
    4,
    96057.9,
  );
}
