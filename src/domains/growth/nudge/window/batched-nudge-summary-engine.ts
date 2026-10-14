import * as flags from "../../../../kit/flags.js";
import { BatchedNudgeSummary } from "./batched-nudge-summary.js";

/** One step of the batched nudge summary calculation. */
export interface BatchedNudgeSummaryFactor {
  describe(): string;
  adjust(item: BatchedNudgeSummary, value: number): number;
}

export class FlaggedBatchedNudgeSummaryAdjuster implements BatchedNudgeSummaryFactor {
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

  adjust(item: BatchedNudgeSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryBatchedNudgeSummaryAdjuster implements BatchedNudgeSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: BatchedNudgeSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class BatchedNudgeSummaryBatchSizeOffsetAdjuster implements BatchedNudgeSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: BatchedNudgeSummary, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentBatchedNudgeSummaryAdjuster implements BatchedNudgeSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedNudgeSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched nudge summary steps in order and keeps a trace of each. */
export class BatchedNudgeSummaryEngine {
  steps: BatchedNudgeSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedNudgeSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedNudgeSummary): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: BatchedNudgeSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedNudgeSummaryEngine(flagsValue: flags.Registry): BatchedNudgeSummaryEngine {
  return new BatchedNudgeSummaryEngine(
    [
      new FlaggedBatchedNudgeSummaryAdjuster(flagsValue, "batched-nudge-summary-rolling", 0.8),
      new CountryBatchedNudgeSummaryAdjuster(new Map<string, number>([["online", 1.1], ["east", 1.08]])),
      new BatchedNudgeSummaryBatchSizeOffsetAdjuster(0.96),
      new PercentBatchedNudgeSummaryAdjuster(-21.9),
    ],
    [],
    4.6,
    72879.3,
  );
}
