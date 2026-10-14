import * as flags from "../../../../kit/flags.js";
import { BatchedCsatEntry } from "./batched-csat-entry.js";

/** One step of the batched csat entry calculation. */
export interface BatchedCsatEntryStep {
  describe(): string;
  adjust(item: BatchedCsatEntry, value: number): number;
}

export class MinimumBatchedCsatEntryAdjuster implements BatchedCsatEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCsatEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedCsatEntryAdjuster implements BatchedCsatEntryStep {
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

  adjust(item: BatchedCsatEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleBatchedCsatEntryAdjuster implements BatchedCsatEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedCsatEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the batched csat entry steps in order and keeps a trace of each. */
export class BatchedCsatEntryEngine {
  steps: BatchedCsatEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCsatEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedCsatEntry): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: BatchedCsatEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedCsatEntryEngine(flagsValue: flags.Registry): BatchedCsatEntryEngine {
  return new BatchedCsatEntryEngine(
    [
      new MinimumBatchedCsatEntryAdjuster(5.8),
      new FlaggedBatchedCsatEntryAdjuster(flagsValue, "batched-csat-entry-batched", -8.3),
      new TitleBatchedCsatEntryAdjuster(
        new Map<string, number>([["retail", 1.28], ["east", 1.29], ["central", 1.17]]),
      ),
    ],
    [],
    4.3,
    80379.2,
  );
}
