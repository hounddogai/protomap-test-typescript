import * as numbers from "../../../../kit/numbers.js";
import { BidRuleAdjustment } from "./bid-rule-adjustment.js";

/** One step of the bid rule adjustment calculation. */
export interface BidRuleAdjustmentAdjuster {
  describe(): string;
  adjust(item: BidRuleAdjustment, value: number): number;
}

export class PercentBidRuleAdjustmentAdjuster implements BidRuleAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BidRuleAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class BidRuleAdjustmentConversionRateOffsetAdjuster implements BidRuleAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: BidRuleAdjustment, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class TieredBidRuleAdjustmentAdjuster implements BidRuleAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BidRuleAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapBidRuleAdjustmentAdjuster implements BidRuleAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BidRuleAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingBidRuleAdjustmentAdjuster implements BidRuleAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BidRuleAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryBidRuleAdjustmentAdjuster implements BidRuleAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: BidRuleAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the bid rule adjustment steps in order and keeps a trace of each. */
export class BidRuleAdjustmentEngine {
  steps: BidRuleAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BidRuleAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BidRuleAdjustment): number {
    let current = item.projectedValue();
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

  evaluateAll(items: BidRuleAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBidRuleAdjustmentEngine(): BidRuleAdjustmentEngine {
  return new BidRuleAdjustmentEngine(
    [
      new PercentBidRuleAdjustmentAdjuster(20.4),
      new BidRuleAdjustmentConversionRateOffsetAdjuster(0.02),
      new TieredBidRuleAdjustmentAdjuster([1344, 8978, 9102], [0.9, 0.87, 0.92]),
      new CapBidRuleAdjustmentAdjuster(17013),
      new RoundingBidRuleAdjustmentAdjuster(0.25),
      new CategoryBidRuleAdjustmentAdjuster(new Map<string, number>([["east", 1.37], ["west", 0.78]])),
    ],
    [],
    2.4,
    90053.9,
  );
}
