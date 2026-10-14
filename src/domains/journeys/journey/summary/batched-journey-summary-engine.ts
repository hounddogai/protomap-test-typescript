import * as flags from "../../../../kit/flags.js";
import { BatchedJourneySummary } from "./batched-journey-summary.js";

/** One step of the batched journey summary calculation. */
export interface BatchedJourneySummaryStep {
  describe(): string;
  adjust(item: BatchedJourneySummary, value: number): number;
}

export class TitleBatchedJourneySummaryAdjuster implements BatchedJourneySummaryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedJourneySummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedBatchedJourneySummaryAdjuster implements BatchedJourneySummaryStep {
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

  adjust(item: BatchedJourneySummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBatchedJourneySummaryAdjuster implements BatchedJourneySummaryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedJourneySummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredBatchedJourneySummaryAdjuster implements BatchedJourneySummaryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedJourneySummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched journey summary steps in order and keeps a trace of each. */
export class BatchedJourneySummaryEngine {
  steps: BatchedJourneySummaryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedJourneySummaryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedJourneySummary): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: BatchedJourneySummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedJourneySummaryEngine(flagsValue: flags.Registry): BatchedJourneySummaryEngine {
  return new BatchedJourneySummaryEngine(
    [
      new TitleBatchedJourneySummaryAdjuster(
        new Map<string, number>([["east", 1.01], ["north", 1.26], ["central", 0.72]]),
      ),
      new FlaggedBatchedJourneySummaryAdjuster(flagsValue, "batched-journey-summary-scheduled", -0.1),
      new MinimumBatchedJourneySummaryAdjuster(23.7),
      new TieredBatchedJourneySummaryAdjuster([406, 654, 5054], [0.93, 0.87, 0.94]),
    ],
    [],
    1.6,
    55173.2,
  );
}
