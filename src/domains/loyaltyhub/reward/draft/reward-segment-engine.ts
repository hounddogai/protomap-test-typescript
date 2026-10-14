import * as numbers from "../../../../kit/numbers.js";
import { RewardSegment } from "./reward-segment.js";

/** One step of the reward segment calculation. */
export interface RewardSegmentModifier {
  describe(): string;
  adjust(item: RewardSegment, value: number): number;
}

export class RewardSegmentOpenRateOffsetAdjuster implements RewardSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: RewardSegment, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class CapRewardSegmentAdjuster implements RewardSegmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRewardSegmentAdjuster implements RewardSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryRewardSegmentAdjuster implements RewardSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RewardSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward segment steps in order and keeps a trace of each. */
export class RewardSegmentEngine {
  steps: RewardSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardSegment): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RewardSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardSegmentEngine(): RewardSegmentEngine {
  return new RewardSegmentEngine(
    [
      new RewardSegmentOpenRateOffsetAdjuster(0.9),
      new CapRewardSegmentAdjuster(4650),
      new TieredRewardSegmentAdjuster([2260, 3938, 9838], [0.96, 0.82, 0.88]),
      new CategoryRewardSegmentAdjuster(
        new Map<string, number>([["east", 1.23], ["online", 1.07], ["central", 1.4]]),
      ),
    ],
    [],
    4.8,
    42316.5,
  );
}
