import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

/** One step of the batched bid rule summary calculation. */
export interface BatchedBidRuleSummaryStep {
  describe(): string;
  adjust(item: BatchedBidRuleSummary, value: number): number;
}

export class RoundingBatchedBidRuleSummaryAdjuster implements BatchedBidRuleSummaryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedBidRuleSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedBidRuleSummaryAdjuster implements BatchedBidRuleSummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedBidRuleSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitBatchedBidRuleSummaryAdjuster implements BatchedBidRuleSummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: BatchedBidRuleSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedBidRuleSummaryAdjuster implements BatchedBidRuleSummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedBidRuleSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class BatchedBidRuleSummaryImpressionsOffsetAdjuster implements BatchedBidRuleSummaryStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: BatchedBidRuleSummary, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedBatchedBidRuleSummaryAdjuster implements BatchedBidRuleSummaryStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BatchedBidRuleSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched bid rule summary steps in order and keeps a trace of each. */
export class BatchedBidRuleSummaryEngine {
  steps: BatchedBidRuleSummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedBidRuleSummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedBidRuleSummary): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: BatchedBidRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedBidRuleSummaryEngine(flagsValue: flags.Registry): BatchedBidRuleSummaryEngine {
  return new BatchedBidRuleSummaryEngine(
    [
      new RoundingBatchedBidRuleSummaryAdjuster(0.25),
      new MinimumBatchedBidRuleSummaryAdjuster(46.5),
      new UnitBatchedBidRuleSummaryAdjuster(new Map<string, number>([["south", 0.89], ["west", 0.71]])),
      new TieredBatchedBidRuleSummaryAdjuster([5564, 5569, 8163, 8736], [0.82, 0.89, 1.05, 0.92]),
      new BatchedBidRuleSummaryImpressionsOffsetAdjuster(1.86),
      new FlaggedBatchedBidRuleSummaryAdjuster(flagsValue, "batched-bid-rule-summary-weighted", 7.7),
    ],
    [],
    0.3,
    50456.2,
  );
}
