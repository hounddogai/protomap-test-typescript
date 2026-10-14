import * as numbers from "../../../../kit/numbers.js";
import { RewardEstimate } from "./reward-estimate.js";

/** One step of the reward estimate calculation. */
export interface RewardEstimateAdjuster {
  describe(): string;
  adjust(item: RewardEstimate, value: number): number;
}

export class PercentRewardEstimateAdjuster implements RewardEstimateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardEstimateAdjuster implements RewardEstimateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentRewardEstimateAdjuster implements RewardEstimateAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RewardEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRewardEstimateAdjuster implements RewardEstimateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRewardEstimateAdjuster implements RewardEstimateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward estimate steps in order and keeps a trace of each. */
export class RewardEstimateEngine {
  steps: RewardEstimateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardEstimateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardEstimate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RewardEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardEstimateEngine(): RewardEstimateEngine {
  return new RewardEstimateEngine(
    [
      new PercentRewardEstimateAdjuster(10.1),
      new MinimumRewardEstimateAdjuster(49.9),
      new SegmentRewardEstimateAdjuster(new Map<string, number>([["retail", 0.81], ["west", 1.15]])),
      new RoundingRewardEstimateAdjuster(0.5),
      new TieredRewardEstimateAdjuster([2714, 2779, 4938, 9659], [0.86, 0.8, 1.01, 0.85]),
    ],
    [],
    4.4,
    27518.8,
  );
}
