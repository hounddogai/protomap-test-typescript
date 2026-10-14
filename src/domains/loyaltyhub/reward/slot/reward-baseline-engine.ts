import * as numbers from "../../../../kit/numbers.js";
import { RewardBaseline } from "./reward-baseline.js";

/** One step of the reward baseline calculation. */
export interface RewardBaselineModifier {
  describe(): string;
  adjust(item: RewardBaseline, value: number): number;
}

export class RoundingRewardBaselineAdjuster implements RewardBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRewardBaselineAdjuster implements RewardBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRewardBaselineAdjuster implements RewardBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRewardBaselineAdjuster implements RewardBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRewardBaselineAdjuster implements RewardBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward baseline steps in order and keeps a trace of each. */
export class RewardBaselineEngine {
  steps: RewardBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardBaseline): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RewardBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardBaselineEngine(): RewardBaselineEngine {
  return new RewardBaselineEngine(
    [
      new RoundingRewardBaselineAdjuster(5),
      new TieredRewardBaselineAdjuster([2172, 5467, 5982, 6807], [1, 1.12, 0.91, 1.02]),
      new MinimumRewardBaselineAdjuster(4.6),
      new CapRewardBaselineAdjuster(20592),
      new PercentRewardBaselineAdjuster(-1.7),
    ],
    [],
    4.2,
    13271.9,
  );
}
