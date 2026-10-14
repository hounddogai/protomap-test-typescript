import * as numbers from "../../../../kit/numbers.js";
import { TieredBidRuleRollup } from "./tiered-bid-rule-rollup.js";

/** One step of the tiered bid rule rollup calculation. */
export interface TieredBidRuleRollupModifier {
  describe(): string;
  adjust(item: TieredBidRuleRollup, value: number): number;
}

export class RoundingTieredBidRuleRollupAdjuster implements TieredBidRuleRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredBidRuleRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredBidRuleRollupAdjuster implements TieredBidRuleRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBidRuleRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredBidRuleRollupAdjuster implements TieredBidRuleRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBidRuleRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredBidRuleRollupAdjuster implements TieredBidRuleRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredBidRuleRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionTieredBidRuleRollupAdjuster implements TieredBidRuleRollupModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TieredBidRuleRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTieredBidRuleRollupAdjuster implements TieredBidRuleRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredBidRuleRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered bid rule rollup steps in order and keeps a trace of each. */
export class TieredBidRuleRollupEngine {
  steps: TieredBidRuleRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBidRuleRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredBidRuleRollup): number {
    let current = item.netTotal();
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

  evaluateAll(items: TieredBidRuleRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredBidRuleRollupEngine(): TieredBidRuleRollupEngine {
  return new TieredBidRuleRollupEngine(
    [
      new RoundingTieredBidRuleRollupAdjuster(1),
      new CapTieredBidRuleRollupAdjuster(27365),
      new PercentTieredBidRuleRollupAdjuster(-13.2),
      new TieredTieredBidRuleRollupAdjuster([2012, 7035, 7332, 8342], [1.19, 0.95, 0.89, 1.08]),
      new RegionTieredBidRuleRollupAdjuster(
        new Map<string, number>([["east", 0.94], ["north", 1.06], ["retail", 1.13]]),
      ),
      new MinimumTieredBidRuleRollupAdjuster(32.9),
    ],
    [],
    2,
    75288.6,
  );
}
