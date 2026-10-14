import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedWindowBatch } from "./batched-window-batch.js";

/** One step of the batched window batch calculation. */
export interface BatchedWindowBatchModifier {
  describe(): string;
  adjust(item: BatchedWindowBatch, value: number): number;
}

export class MinimumBatchedWindowBatchAdjuster implements BatchedWindowBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedWindowBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelBatchedWindowBatchAdjuster implements BatchedWindowBatchModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: BatchedWindowBatch, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBatchedWindowBatchAdjuster implements BatchedWindowBatchModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedWindowBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedBatchedWindowBatchAdjuster implements BatchedWindowBatchModifier {
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

  adjust(item: BatchedWindowBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedWindowBatchSequenceOffsetAdjuster implements BatchedWindowBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: BatchedWindowBatch, value: number): number {
    return value + item.sequence * this.weight;
  }
}

/** Runs the batched window batch steps in order and keeps a trace of each. */
export class BatchedWindowBatchEngine {
  steps: BatchedWindowBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWindowBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedWindowBatch): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: BatchedWindowBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedWindowBatchEngine(flagsValue: flags.Registry): BatchedWindowBatchEngine {
  return new BatchedWindowBatchEngine(
    [
      new MinimumBatchedWindowBatchAdjuster(36.4),
      new LabelBatchedWindowBatchAdjuster(
        new Map<string, number>([["south", 1.1], ["online", 1.24], ["central", 1.2]]),
      ),
      new PercentBatchedWindowBatchAdjuster(7.7),
      new FlaggedBatchedWindowBatchAdjuster(flagsValue, "batched-window-batch-tiered", -7.6),
      new BatchedWindowBatchSequenceOffsetAdjuster(1.42),
    ],
    [],
    0.2,
    42531.8,
  );
}
