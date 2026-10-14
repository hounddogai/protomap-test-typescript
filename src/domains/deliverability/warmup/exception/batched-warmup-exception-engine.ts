import * as flags from "../../../../kit/flags.js";
import { BatchedWarmupException } from "./batched-warmup-exception.js";

/** One step of the batched warmup exception calculation. */
export interface BatchedWarmupExceptionModifier {
  describe(): string;
  adjust(item: BatchedWarmupException, value: number): number;
}

export class MinimumBatchedWarmupExceptionAdjuster implements BatchedWarmupExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedWarmupException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedWarmupExceptionAdjuster implements BatchedWarmupExceptionModifier {
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

  adjust(item: BatchedWarmupException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedWarmupExceptionScoreOffsetAdjuster implements BatchedWarmupExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: BatchedWarmupException, value: number): number {
    return value + item.score * this.weight;
  }
}

/** Runs the batched warmup exception steps in order and keeps a trace of each. */
export class BatchedWarmupExceptionEngine {
  steps: BatchedWarmupExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWarmupExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedWarmupException): number {
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

  evaluateAll(items: BatchedWarmupException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedWarmupExceptionEngine(flagsValue: flags.Registry): BatchedWarmupExceptionEngine {
  return new BatchedWarmupExceptionEngine(
    [
      new MinimumBatchedWarmupExceptionAdjuster(36),
      new FlaggedBatchedWarmupExceptionAdjuster(flagsValue, "batched-warmup-exception-regional", -5.1),
      new BatchedWarmupExceptionScoreOffsetAdjuster(0.24),
    ],
    [],
    3.2,
    33783.7,
  );
}
