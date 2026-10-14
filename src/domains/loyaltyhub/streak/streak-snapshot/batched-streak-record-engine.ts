import * as numbers from "../../../../kit/numbers.js";
import { BatchedStreakRecord } from "./batched-streak-record.js";

/** One step of the batched streak record calculation. */
export interface BatchedStreakRecordFactor {
  describe(): string;
  adjust(item: BatchedStreakRecord, value: number): number;
}

export class UtmSourceBatchedStreakRecordAdjuster implements BatchedStreakRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: BatchedStreakRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedStreakRecordAdjuster implements BatchedStreakRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedStreakRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedStreakRecordAdjuster implements BatchedStreakRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedStreakRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumBatchedStreakRecordAdjuster implements BatchedStreakRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedStreakRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedStreakRecordWeightOffsetAdjuster implements BatchedStreakRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: BatchedStreakRecord, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the batched streak record steps in order and keeps a trace of each. */
export class BatchedStreakRecordEngine {
  steps: BatchedStreakRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedStreakRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedStreakRecord): number {
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

  evaluateAll(items: BatchedStreakRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedStreakRecordEngine(): BatchedStreakRecordEngine {
  return new BatchedStreakRecordEngine(
    [
      new UtmSourceBatchedStreakRecordAdjuster(new Map<string, number>([["central", 1.19]])),
      new PercentBatchedStreakRecordAdjuster(21.8),
      new RoundingBatchedStreakRecordAdjuster(0.05),
      new MinimumBatchedStreakRecordAdjuster(13.8),
      new BatchedStreakRecordWeightOffsetAdjuster(1.97),
    ],
    [],
    2.1,
    84374.8,
  );
}
