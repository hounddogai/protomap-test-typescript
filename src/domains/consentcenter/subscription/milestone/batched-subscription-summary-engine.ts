import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedSubscriptionSummary } from "./batched-subscription-summary.js";

/** One step of the batched subscription summary calculation. */
export interface BatchedSubscriptionSummaryModifier {
  describe(): string;
  adjust(item: BatchedSubscriptionSummary, value: number): number;
}

export class LabelBatchedSubscriptionSummaryAdjuster implements BatchedSubscriptionSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedSubscriptionSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedSubscriptionSummaryAdjuster implements BatchedSubscriptionSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedSubscriptionSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedSubscriptionSummaryAdjuster implements BatchedSubscriptionSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedSubscriptionSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedSubscriptionSummaryAdjuster implements BatchedSubscriptionSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedSubscriptionSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBatchedSubscriptionSummaryAdjuster implements BatchedSubscriptionSummaryModifier {
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

  adjust(item: BatchedSubscriptionSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched subscription summary steps in order and keeps a trace of each. */
export class BatchedSubscriptionSummaryEngine {
  steps: BatchedSubscriptionSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedSubscriptionSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedSubscriptionSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedSubscriptionSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedSubscriptionSummaryEngine(flagsValue: flags.Registry): BatchedSubscriptionSummaryEngine {
  return new BatchedSubscriptionSummaryEngine(
    [
      new LabelBatchedSubscriptionSummaryAdjuster(new Map<string, number>([["online", 1.21]])),
      new PercentBatchedSubscriptionSummaryAdjuster(-17.3),
      new RoundingBatchedSubscriptionSummaryAdjuster(5),
      new TieredBatchedSubscriptionSummaryAdjuster([1461, 6880], [0.88, 1.07]),
      new FlaggedBatchedSubscriptionSummaryAdjuster(flagsValue, "batched-subscription-summary-rolling", -2.8),
    ],
    [],
    2.4,
    51514.6,
  );
}
