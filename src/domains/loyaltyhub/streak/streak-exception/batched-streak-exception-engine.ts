import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedStreakException } from "./batched-streak-exception.js";

/** One step of the batched streak exception calculation. */
export interface BatchedStreakExceptionStep {
  describe(): string;
  adjust(item: BatchedStreakException, value: number): number;
}

export class MinimumBatchedStreakExceptionAdjuster implements BatchedStreakExceptionStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedStreakException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BatchedStreakExceptionThresholdOffsetAdjuster implements BatchedStreakExceptionStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: BatchedStreakException, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class FlaggedBatchedStreakExceptionAdjuster implements BatchedStreakExceptionStep {
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

  adjust(item: BatchedStreakException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedStreakExceptionAdjuster implements BatchedStreakExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedStreakException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched streak exception steps in order and keeps a trace of each. */
export class BatchedStreakExceptionEngine {
  steps: BatchedStreakExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedStreakExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedStreakException): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: BatchedStreakException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedStreakExceptionEngine(flagsValue: flags.Registry): BatchedStreakExceptionEngine {
  return new BatchedStreakExceptionEngine(
    [
      new MinimumBatchedStreakExceptionAdjuster(27.1),
      new BatchedStreakExceptionThresholdOffsetAdjuster(0.28),
      new FlaggedBatchedStreakExceptionAdjuster(flagsValue, "batched-streak-exception-lenient", -3),
      new PercentBatchedStreakExceptionAdjuster(-20.2),
    ],
    [],
    1.4,
    72474.9,
  );
}
