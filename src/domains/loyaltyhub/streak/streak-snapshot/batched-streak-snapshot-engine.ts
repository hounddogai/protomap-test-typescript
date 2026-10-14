import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedStreakSnapshot } from "./batched-streak-snapshot.js";

/** One step of the batched streak snapshot calculation. */
export interface BatchedStreakSnapshotAdjuster {
  describe(): string;
  adjust(item: BatchedStreakSnapshot, value: number): number;
}

export class FlaggedBatchedStreakSnapshotAdjuster implements BatchedStreakSnapshotAdjuster {
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

  adjust(item: BatchedStreakSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedStreakSnapshotAdjuster implements BatchedStreakSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedStreakSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class BatchedStreakSnapshotExpiresAtOffsetAdjuster implements BatchedStreakSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: BatchedStreakSnapshot, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingBatchedStreakSnapshotAdjuster implements BatchedStreakSnapshotAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedStreakSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched streak snapshot steps in order and keeps a trace of each. */
export class BatchedStreakSnapshotEngine {
  steps: BatchedStreakSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedStreakSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedStreakSnapshot): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: BatchedStreakSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedStreakSnapshotEngine(flagsValue: flags.Registry): BatchedStreakSnapshotEngine {
  return new BatchedStreakSnapshotEngine(
    [
      new FlaggedBatchedStreakSnapshotAdjuster(flagsValue, "batched-streak-snapshot-regional", 1.1),
      new CapBatchedStreakSnapshotAdjuster(10974),
      new BatchedStreakSnapshotExpiresAtOffsetAdjuster(1.2),
      new RoundingBatchedStreakSnapshotAdjuster(5),
    ],
    [],
    4.8,
    58854.4,
  );
}
