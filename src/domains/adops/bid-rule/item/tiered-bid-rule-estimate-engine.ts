import * as numbers from "../../../../kit/numbers.js";
import { TieredBidRuleEstimate } from "./tiered-bid-rule-estimate.js";

/** One step of the tiered bid rule estimate calculation. */
export interface TieredBidRuleEstimateModifier {
  describe(): string;
  adjust(item: TieredBidRuleEstimate, value: number): number;
}

export class PercentTieredBidRuleEstimateAdjuster implements TieredBidRuleEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBidRuleEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SegmentTieredBidRuleEstimateAdjuster implements TieredBidRuleEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredBidRuleEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredBidRuleEstimateAdjuster implements TieredBidRuleEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBidRuleEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingTieredBidRuleEstimateAdjuster implements TieredBidRuleEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBidRuleEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTieredBidRuleEstimateAdjuster implements TieredBidRuleEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredBidRuleEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBidRuleEstimateEndsAtOffsetAdjuster implements TieredBidRuleEstimateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: TieredBidRuleEstimate, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the tiered bid rule estimate steps in order and keeps a trace of each. */
export class TieredBidRuleEstimateEngine {
  steps: TieredBidRuleEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBidRuleEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredBidRuleEstimate): number {
    let current = item.netLoad();
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

  evaluateAll(items: TieredBidRuleEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredBidRuleEstimateEngine(): TieredBidRuleEstimateEngine {
  return new TieredBidRuleEstimateEngine(
    [
      new PercentTieredBidRuleEstimateAdjuster(-13.2),
      new SegmentTieredBidRuleEstimateAdjuster(new Map<string, number>([["east", 1.31]])),
      new CapTieredBidRuleEstimateAdjuster(29377),
      new RoundingTieredBidRuleEstimateAdjuster(0.25),
      new MinimumTieredBidRuleEstimateAdjuster(0.9),
      new TieredBidRuleEstimateEndsAtOffsetAdjuster(0.48),
    ],
    [],
    0.7,
    76240.6,
  );
}
