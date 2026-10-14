import * as flags from "../../../../kit/flags.js";
import { RollingPayoutBatch } from "./rolling-payout-batch.js";

/** One step of the rolling payout batch calculation. */
export interface RollingPayoutBatchAdjuster {
  describe(): string;
  adjust(item: RollingPayoutBatch, value: number): number;
}

export class CapRollingPayoutBatchAdjuster implements RollingPayoutBatchAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPayoutBatch, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingPayoutBatchAdjuster implements RollingPayoutBatchAdjuster {
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

  adjust(item: RollingPayoutBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingPayoutBatchAdjuster implements RollingPayoutBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPayoutBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling payout batch steps in order and keeps a trace of each. */
export class RollingPayoutBatchEngine {
  steps: RollingPayoutBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPayoutBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingPayoutBatch): number {
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

  evaluateAll(items: RollingPayoutBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingPayoutBatchEngine(flagsValue: flags.Registry): RollingPayoutBatchEngine {
  return new RollingPayoutBatchEngine(
    [
      new CapRollingPayoutBatchAdjuster(45646),
      new FlaggedRollingPayoutBatchAdjuster(flagsValue, "rolling-payout-batch-rolling", -6.1),
      new PercentRollingPayoutBatchAdjuster(15.7),
    ],
    [],
    2,
    68553.3,
  );
}
