import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedCreditOverride } from "./batched-credit-override.js";

/** One step of the batched credit override calculation. */
export interface BatchedCreditOverrideAdjuster {
  describe(): string;
  adjust(item: BatchedCreditOverride, value: number): number;
}

export class MinimumBatchedCreditOverrideAdjuster implements BatchedCreditOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedCreditOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapBatchedCreditOverrideAdjuster implements BatchedCreditOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedCreditOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedBatchedCreditOverrideAdjuster implements BatchedCreditOverrideAdjuster {
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

  adjust(item: BatchedCreditOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedCreditOverrideAdjuster implements BatchedCreditOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedCreditOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the batched credit override steps in order and keeps a trace of each. */
export class BatchedCreditOverrideEngine {
  steps: BatchedCreditOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedCreditOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedCreditOverride): number {
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

  evaluateAll(items: BatchedCreditOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedCreditOverrideEngine(flagsValue: flags.Registry): BatchedCreditOverrideEngine {
  return new BatchedCreditOverrideEngine(
    [
      new MinimumBatchedCreditOverrideAdjuster(45),
      new CapBatchedCreditOverrideAdjuster(8316),
      new FlaggedBatchedCreditOverrideAdjuster(flagsValue, "batched-credit-override-strict", 3.8),
      new RoundingBatchedCreditOverrideAdjuster(0.5),
    ],
    [],
    3.8,
    43055.9,
  );
}
