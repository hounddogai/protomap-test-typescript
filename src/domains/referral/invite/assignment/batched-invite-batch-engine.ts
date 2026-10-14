import * as flags from "../../../../kit/flags.js";
import { BatchedInviteBatch } from "./batched-invite-batch.js";

/** One step of the batched invite batch calculation. */
export interface BatchedInviteBatchModifier {
  describe(): string;
  adjust(item: BatchedInviteBatch, value: number): number;
}

export class FlaggedBatchedInviteBatchAdjuster implements BatchedInviteBatchModifier {
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

  adjust(item: BatchedInviteBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BatchedInviteBatchFloorValueOffsetAdjuster implements BatchedInviteBatchModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: BatchedInviteBatch, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class CapBatchedInviteBatchAdjuster implements BatchedInviteBatchModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedInviteBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumBatchedInviteBatchAdjuster implements BatchedInviteBatchModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedInviteBatch, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the batched invite batch steps in order and keeps a trace of each. */
export class BatchedInviteBatchEngine {
  steps: BatchedInviteBatchModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedInviteBatchModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedInviteBatch): number {
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

  evaluateAll(items: BatchedInviteBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedInviteBatchEngine(flagsValue: flags.Registry): BatchedInviteBatchEngine {
  return new BatchedInviteBatchEngine(
    [
      new FlaggedBatchedInviteBatchAdjuster(flagsValue, "batched-invite-batch-scheduled", 6.7),
      new BatchedInviteBatchFloorValueOffsetAdjuster(1.91),
      new CapBatchedInviteBatchAdjuster(8857),
      new MinimumBatchedInviteBatchAdjuster(17.3),
    ],
    [],
    2.9,
    25916.7,
  );
}
