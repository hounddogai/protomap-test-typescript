import * as flags from "../../../../kit/flags.js";
import { BatchedWaitPolicy } from "./batched-wait-policy.js";

/** One step of the batched wait policy calculation. */
export interface BatchedWaitPolicyAdjuster {
  describe(): string;
  adjust(item: BatchedWaitPolicy, value: number): number;
}

export class BatchedWaitPolicyThresholdOffsetAdjuster implements BatchedWaitPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: BatchedWaitPolicy, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapBatchedWaitPolicyAdjuster implements BatchedWaitPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedWaitPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBatchedWaitPolicyAdjuster implements BatchedWaitPolicyAdjuster {
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

  adjust(item: BatchedWaitPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentBatchedWaitPolicyAdjuster implements BatchedWaitPolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedWaitPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched wait policy steps in order and keeps a trace of each. */
export class BatchedWaitPolicyEngine {
  steps: BatchedWaitPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedWaitPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BatchedWaitPolicy): number {
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

  evaluateAll(items: BatchedWaitPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBatchedWaitPolicyEngine(flagsValue: flags.Registry): BatchedWaitPolicyEngine {
  return new BatchedWaitPolicyEngine(
    [
      new BatchedWaitPolicyThresholdOffsetAdjuster(0.95),
      new CapBatchedWaitPolicyAdjuster(10715),
      new FlaggedBatchedWaitPolicyAdjuster(flagsValue, "batched-wait-policy-pending", -7.4),
      new PercentBatchedWaitPolicyAdjuster(-16),
    ],
    [],
    0.3,
    2735.9,
  );
}
