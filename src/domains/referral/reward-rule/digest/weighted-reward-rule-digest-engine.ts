import * as numbers from "../../../../kit/numbers.js";
import { WeightedRewardRuleDigest } from "./weighted-reward-rule-digest.js";

/** One step of the weighted reward rule digest calculation. */
export interface WeightedRewardRuleDigestAdjuster {
  describe(): string;
  adjust(item: WeightedRewardRuleDigest, value: number): number;
}

export class RoundingWeightedRewardRuleDigestAdjuster implements WeightedRewardRuleDigestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedRewardRuleDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LocaleWeightedRewardRuleDigestAdjuster implements WeightedRewardRuleDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: WeightedRewardRuleDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedRewardRuleDigestUpdatedAtOffsetAdjuster implements WeightedRewardRuleDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: WeightedRewardRuleDigest, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CapWeightedRewardRuleDigestAdjuster implements WeightedRewardRuleDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedRewardRuleDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedRewardRuleDigestAdjuster implements WeightedRewardRuleDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedRewardRuleDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted reward rule digest steps in order and keeps a trace of each. */
export class WeightedRewardRuleDigestEngine {
  steps: WeightedRewardRuleDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedRewardRuleDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedRewardRuleDigest): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WeightedRewardRuleDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedRewardRuleDigestEngine(): WeightedRewardRuleDigestEngine {
  return new WeightedRewardRuleDigestEngine(
    [
      new RoundingWeightedRewardRuleDigestAdjuster(0.25),
      new LocaleWeightedRewardRuleDigestAdjuster(new Map<string, number>([["south", 1.28]])),
      new WeightedRewardRuleDigestUpdatedAtOffsetAdjuster(0.38),
      new CapWeightedRewardRuleDigestAdjuster(5788),
      new TieredWeightedRewardRuleDigestAdjuster([2895, 3102, 4957, 6815], [1.05, 0.8, 1.18, 0.83]),
    ],
    [],
    0.6,
    85862.8,
  );
}
